const { verifyToken, createClerkClient } = require("@clerk/backend");
const ClerkUser = require("../models/ClerkUser");
const Employee = require("../models/Employee");

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const verifyClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token" });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const user = await clerk.users.getUser(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    const email =
      user.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";

    console.log("🔹 Clerk user fetched:", {
      id: user.id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      publicMetadata: user.publicMetadata,
    });

    // 1️⃣ Check Employee
    const employee = await Employee.findOne({ email });
    console.log("🔹 Employee record found:", employee);

    // 2️⃣ Check ClerkUser (superadmin, trainer, completed profiles)
    let dbUser = await ClerkUser.findOne({ sub: user.id });
    console.log("🔹 ClerkUser record found:", dbUser);

    // Extract Clerk metadata role
    const metaRole = user.publicMetadata?.role?.toLowerCase() || "";
    let finalRole = "member";

    // ⭐⭐⭐ ROLE PRIORITY ORDER (Trainer added) ⭐⭐⭐
    if (metaRole === "superadmin") {
      finalRole = "superadmin";
    } else if (metaRole === "admin" || metaRole === "staff") {
      finalRole = metaRole;
    } else if (metaRole === "trainer") {
      finalRole = "trainer"; // ⬅️ NEW
    } else if (employee) {
      finalRole = employee.requestAdminAccess ? "admin" : "staff";
    } else if (dbUser?.role === "trainer") {
      finalRole = "trainer"; // ⬅️ NEW
    } else if (dbUser?.role) {
      finalRole = dbUser.role;
    }

    console.log("🔹 Final role determined:", finalRole);

    // Name Priority
    const fullNameFromEmployee = employee?.fullName?.trim() || "";
    const fullNameFromDb = dbUser?.fullName?.trim() || "";
    const fullNameFromClerk =
      user.fullName?.trim() ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      email.split("@")[0];

    const finalFullName =
      fullNameFromEmployee || fullNameFromDb || fullNameFromClerk;

    console.log("🧠 Final full name determined:", finalFullName);

    // Sync ClerkUser
    if (!dbUser) {
      dbUser = await ClerkUser.create({
        sub: user.id,
        email,
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        fullName: finalFullName,
        role: finalRole,
        requestAdminAccess: employee?.requestAdminAccess || false,
        department: employee?.department || "",
        position: employee?.position || "",
      });
      console.log("🆕 Created new ClerkUser record for:", email);
    } else {
      const needsUpdate =
        dbUser.role !== finalRole || dbUser.fullName !== finalFullName;

      if (needsUpdate) {
        dbUser.role = finalRole;
        dbUser.fullName = finalFullName;
        await dbUser.save();
        console.log("🔄 Updated ClerkUser with latest name & role");
      }
    }

    // Attach user to request
    req.clerkUser = {
      sub: user.id,
      email,
      role: finalRole,
      fullName: finalFullName,
    };

    console.log("✅ Clerk user attached to request:", req.clerkUser);
    next();
  } catch (err) {
    console.error("❌ Clerk token verification failed:", err);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyClerkToken;
