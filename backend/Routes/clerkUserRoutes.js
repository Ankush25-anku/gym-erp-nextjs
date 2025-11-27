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
      gymCode, // 👈 now accepting gymCode
      fcmToken, // 👈 now accepting fcmToken
      platform,
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
    } = req.body;

    const finalFullName =
      fullName?.trim() ||
      `${first_name || ""} ${last_name || ""}`.trim() ||
      (email ? email.split("@")[0] : "");

    const finalEmail = email?.toLowerCase().trim() || email || clerkEmail;

    const updatePayload = {
      sub,
      email: finalEmail,
      first_name,
      last_name,
      fullName: finalFullName,
      role: role || role,
      phone: phone || "",
      gender: gender || "",
      dob: dob || "",
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "",
      zipcode: zipcode || "",
      imageUrl: imageUrl || "",
      additionalInfo: additionalInfo || "",
      gymCode: gymCode || "", // ✅ now stored
    };

    // 🔥 Append FCM token into array if sent ✅
    if (fcmToken) {
      updatePayload.$addToSet = {
        fcmTokens: {
          token: fcmToken,
          platform: platform || platform || "web",
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
      user: updatedUser,
    });
  } catch (err) {
    console.error("🔴 Sync Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to sync Clerk user" });
  }
});

// ------------------------------------
// 2️⃣ Get logged-in user ✅
// ------------------------------------
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
      gymCode: user.gymCode, // ✅ now returned
      fcmTokens: user.fcmTokens, // ✅ also returned to verify
      phone: user.phone,
      gender: user.gender,
      dob: user.dob,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      zipcode: user.zipcode,
      imageUrl: user.imageUrl,
      additionalInfo: user.additionalInfo,
    });
  } catch (err) {
    console.error("🔴 /me route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------
// 3️⃣ Fetch all users belonging to an approved gym ✅ (Fixed)
// ------------------------------------------------------
router.get("/by-gym/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;
    if (!gymCode) return res.status(400).json({ error: "GymCode required" });

    // 1️⃣ Get approved admins for this gym
    const approvals = await GymApproval.find({ gymCode, status: "approved" });
    if (!approvals.length) return res.json([]);

    const emails = approvals.map((a) => a.adminEmail.toLowerCase());

    // 2️⃣ Fetch all users in this gym that were approved OR joined
    const users = await ClerkUser.find({
      email: { $in: emails },
      gymCode: gymCode,
    }).select("fullName email role imageUrl fcmTokens");

    // 3️⃣ Format final list ✅
    const formatted = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      imageUrl: u.imageUrl,
      fcmTokens: u.fcmTokens, // ✅ correct array now returned
    }));

    res.json(formatted);
  } catch (err) {
    console.error("🔥 Gym member fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch gym members" });
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
