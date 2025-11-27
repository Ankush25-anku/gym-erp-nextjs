const express = require("express");
const router = express.Router();
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const GymApproval = require("../models/GymApproval");

// 🔁 Sync Clerk user to MongoDB with full profile
router.post("/sync", verifyClerkToken, async (req, res) => {
  try {
    const { sub, email: clerkEmail, first_name, last_name } = req.clerkUser;
    const { gymCode, fcmToken, platform } = req.body;

    // Final computed name
    const finalFullName =
      `${first_name || ""} ${last_name || ""}`.trim() ||
      clerkEmail.split("@")[0];

    const finalEmail = clerkEmail.toLowerCase().trim();

    const updatePayload = {
      sub,
      email: finalEmail,
      first_name,
      last_name,
      fullName: finalFullName,
      role: "member",
      phone: "",
      imageUrl: "",
      additionalInfo: "",
      gymCode: gymCode || "",
    };

    // 🔥 Add FCM token into fcmTokens array (avoid duplicates) ✅
    if (fcmToken) {
      updatePayload.$addToSet = {
        fcmTokens: {
          token: fcmToken,
          platform: platform || "web",
          createdAt: new Date(),
        },
      };
    }

    const updatedUser = await ClerkUser.findOneAndUpdate(
      { sub },
      updatePayload,
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "User profile synced successfully ✅",
      tokensStored: updatedUser.fcmTokens.length,
      user: updatedUser,
    });
  } catch (err) {
    console.error("🔴 Sync Error:", err);
    res.status(500).json({ success: false, message: "Failed to sync user" });
  }
});

// ---------------------------------
// 🙋‍♂️ Get logged in user ✅
// ---------------------------------
router.get("/me", verifyClerkToken, async (req, res) => {
  try {
    const { sub, email, role, fullName } = req.clerkUser;

    let user = await ClerkUser.findOne({ sub });
    if (!user && email) {
      user = await ClerkUser.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      return res.json({ sub, email, role, fullName });
    }

    res.json({
      _id: user._id,
      sub: user.sub,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      gymCode: user.gymCode,
      fcmTokens: user.fcmTokens,
      phone: user.phone,
      gender: user.gender,
      dob: user.dob,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      zipcode: user.zipcode,
      imageUrl: user.imageUrl,
    });
  } catch (err) {
    console.error("❌ Error fetching /me:", err.message);
    res.status(500).json({ success: false });
  }
});

// ---------------------------------------------------
// 👥 Get ALL USERS that belong to *approved gym* ✅
// ---------------------------------------------------
router.get("/by-gym/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;
    if (!gymCode) return res.status(400).json([]);

    // ✅ Step 1 → Get approved emails for this gym (from approval model)
    const approvals = await GymApproval.find({
      gymCode,
      status: "approved",
    });
    if (!approvals.length) return res.json([]);

    const approvedEmails = approvals.map((a) => a.adminEmail.toLowerCase());

    // ✅ Step 2 → Fetch users from ClerkUser that belong to this gym by email
    const users = await ClerkUser.find({
      email: { $in: approvedEmails },
      gymCode: gymCode,
      "fcmTokens.token": { $exists: true, $ne: "" }, // ensures they have at least one valid FCM token
    });

    // ✅ Extract unique tokens for broadcast
    const uniqueTokens = [
      ...new Set(users.flatMap((u) => u.fcmTokens.map((f) => f.token))),
    ];

    const formatted = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      imageUrl: u.imageUrl,
      fcmTokenCount: u.fcmTokens.length,
    }));

    res.json({
      success: true,
      gymCode,
      resultCount: formatted.length,
      tokensReady: uniqueTokens.length,
      members: formatted,
      fcmTokens: uniqueTokens, // 👈 used for FCM send API
    });
  } catch (err) {
    console.error("❌ Gym fetch:", err.message);
    res.status(500).json([]);
  }
});

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

module.exports = router;
