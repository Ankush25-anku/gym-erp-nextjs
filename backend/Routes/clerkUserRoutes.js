const express = require("express");
const router = express.Router();
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const GymApproval = require("../models/GymApproval");

// 🔁 Sync Clerk user to MongoDB with full profile
router.post("/sync", verifyClerkToken, async (req, res) => {
  try {
    const {
      sub,
      email: clerkEmail,
      first_name,
      last_name,
      role,
    } = req.clerkUser;
    const {
      schoolCode,
      fullName,
      email,
      phone,
      gender,
      dob,
      address,
      city,
      state,
      country,
      zipcode,
      imageUrl,
      additionalInfo,
      requestAdminAccess,
    } = req.body;

    const finalFullName =
      fullName?.trim() ||
      `${first_name || ""} ${last_name || ""}`.trim() ||
      (clerkEmail ? clerkEmail.split("@")[0] : "");

    const finalEmail = email?.toLowerCase() || clerkEmail.toLowerCase();

    let user = await ClerkUser.findOne({ sub });

    if (!user) {
      // Mongo will auto generate _id here ✅ so we don't need it from frontend
      user = await ClerkUser.create({
        sub,
        email: finalEmail,
        first_name,
        last_name,
        fullName: finalFullName,
        role,
        phone,
        gender,
        dob,
        schoolCode: schoolCode || "",
        requestAdminAccess: requestAdminAccess || false,
        address,
        city,
        state,
        country,
        zipcode,
        imageUrl: imageUrl || "",
        additionalInfo,
      });

      console.log("🟢 New ClerkUser created with Mongo _id:", user._id);
    } else {
      // Update existing user ✅ _id remains same
      user = await ClerkUser.findOneAndUpdate(
        { sub },
        {
          fullName: finalFullName,
          email: finalEmail,
          phone,
          gender,
          dob,
          schoolCode: schoolCode || "",
          address,
          city,
          state,
          country,
          zipcode,
          imageUrl: imageUrl || "",
          additionalInfo,
          requestAdminAccess: requestAdminAccess || false,
        },
        { new: true }
      );

      console.log("🔁 ClerkUser updated with Mongo _id:", user._id);
    }

    // ✅ Just return the DB user, containing the _id internally
    res.json({
      success: true,
      user,
      message: "Clerk user synced successfully ✅",
    });
  } catch (err) {
    console.error("🔴 Sync Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to sync Clerk user ❌" });
  }
});

// 🙋‍♂️ Get logged-in Clerk user info
router.get("/me", verifyClerkToken, async (req, res) => {
  try {
    const { sub, role, email, fullName } = req.clerkUser;

    // Try by sub first
    let user = await ClerkUser.findOne({ sub });

    // If not found, try by email
    if (!user && email) {
      user = await ClerkUser.findOne({ email });
    }

    // 🧩 Auto-fix missing fullName in DB
    if (user && !user.fullName) {
      user.fullName =
        `${req.clerkUser.first_name || ""} ${
          req.clerkUser.last_name || ""
        }`.trim() || "";
      await user.save();
      console.log("🧩 Auto-fixed missing fullName for:", user.email);
    }

    // If still not found, fallback
    if (!user) {
      return res.json({
        sub,
        email,
        role: role || "user",
        fullName: fullName || "User",
      });
    }

    res.json({
      _id: user._id,
      sub: user.sub,
      email: user.email,
      role: user.role || role || "user",
      fullName: user.fullName || fullName || "User",
      phone: user.phone || "",
      gender: user.gender || "",
      dob: user.dob || "",
      gymCode: user.gymCode || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      zipcode: user.zipcode || "",
      imageUrl: user.imageUrl || "",
      additionalInfo: user.additionalInfo || "",
    });
  } catch (err) {
    console.error("🔴 /me route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// routes/clerkUsers.js
router.get("/get-role", verifyClerkToken, async (req, res) => {
  try {
    const { sub, email, first_name, last_name, role } = req.clerkUser;

    // Try to find existing Clerk user
    let user = await ClerkUser.findOne({ sub });

    if (!user) {
      user = await ClerkUser.create({
        sub,
        email,
        first_name,
        last_name,
        fullName: `${first_name} ${last_name}`.trim() || "",
        role: role || "member",
      });
      console.log("🟢 New ClerkUser created:", user);
    }

    // 🔍 Check if the Clerk user is also an Employee (staff)
    const Employee = require("../models/Employee");
    const employee = await Employee.findOne({ email });

    let finalRole = user.role;
    if (employee && employee.requestAdminAccess) {
      finalRole = "admin";
    } else if (employee) {
      finalRole = "staff";
    }

    res.json({
      role: finalRole,
      allowedEmail: user.email,
      requestAdminAccess: employee?.requestAdminAccess || false,
    });
  } catch (err) {
    console.error("🔴 /get-role route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔥 Get all Clerk Users belonging to a specific gym
router.get("/by-gym/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;

    if (!gymCode) {
      return res.status(400).json({ error: "Gym code is required" });
    }

    // 1️⃣ Find approved users for this gym using GymApproval
    const approvals = await GymApproval.find({
      gymCode,
      status: "approved",
    });

    if (!approvals.length) {
      return res.json([]); // no users
    }

    // 2️⃣ Extract all approved emails
    const emails = approvals.map((u) => u.adminEmail.toLowerCase());

    // 3️⃣ Fetch ClerkUser details
    const users = await ClerkUser.find({
      email: { $in: emails },
    }).select("fullName email role imageUrl fcmToken");

    res.json(users);
  } catch (err) {
    console.error("🔥 Error fetching users by gym:", err);
    res.status(500).json({ error: "Failed to fetch users by gym" });
  }
});

// 🔹 GET /members-only/:gymCode - Fetch only approved members (role = member) of that specific gym
router.get("/members-only/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const gymCode = req.params.gymCode.toUpperCase().trim();

    console.log("📩 Fetching ONLY approved members for gym:", gymCode);

    // 1️⃣ Get approved member approval records for this gym
    const approvals = await GymApproval.find({
      gymCode,
      status: "approved",
      role: "member", // ✅ ensure only member approvals
    }).lean();

    if (!approvals.length) {
      console.warn("⚠️ No approved member records found for gym:", gymCode);
      return res.json({ success: true, members: [] });
    }

    // 2️⃣ Extract emails from approval records
    const emails = approvals.map((u) => u.adminEmail.toLowerCase().trim());

    // 3️⃣ Fetch from ClerkUser but ONLY actual members
    const members = await ClerkUser.find({
      email: { $in: emails },
      role: "member",             // ✅ only members
    }).select("fullName email role imageUrl fcmTokens");

    console.log(`✅ Found ${members.length} member(s)`);
    res.json({ success: true, members });
  } catch (err) {
    console.error("❌ Member-only fetch error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
