const express = require("express");
const admin = require("../firebaseAdmin");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const GymApproval = require("../models/GymApproval");

const router = express.Router();

// SEND NOTIFICATION ✅ (GymCode from GymApproval model, Tokens from ClerkUser)
router.post("/send", verifyClerkToken, async (req, res) => {
  const { userId, title, body } = req.body; // 👈 no need to accept gymCode from frontend now

  if (!title || !body) {
    return res
      .status(400)
      .json({ success: false, message: "Title & body required" });
  }

  try {
    // -------------------------------------------------------
    // 1️⃣ Get GymCode for Logged-in Admin using his email ✅
    // -------------------------------------------------------
    const adminEmail = req.clerkUser.email.toLowerCase().trim();

    const approvalRecord = await GymApproval.findOne({
      adminEmail,
      status: "approved",
    });

    if (!approvalRecord) {
      return res.status(404).json({
        success: false,
        message: "No approved gym found for this admin",
        adminEmail,
      });
    }

    const gymCode = approvalRecord.gymCode;
    console.log("🏋 Fetched gymCode from Approval model ✅:", gymCode);

    // -------------------------------------------------------
    // 2️⃣ Collect tokens from ClerkUser collection ✅
    // -------------------------------------------------------
    let tokens = [];

    // Broadcast to ALL approved users of the admin's gym ✅
    if (userId === "all") {
      const users = await ClerkUser.find({
        gymCode, // ✅ only that gym code
        "fcmTokens.token": { $exists: true, $ne: "" }, // ✅ token must exist and not empty
      });

      tokens = users.flatMap((u) => u.fcmTokens.map((f) => f.token));
    }

    // Send to specific user ✅ (still gym restricted)
    else {
      const user = await ClerkUser.findOne({ _id: userId, gymCode });

      if (!user) {
        return res.status(403).json({
          success: false,
          message: "User not found in this admin's approved gym",
        });
      }

      tokens = user.fcmTokens.map((f) => f.token);
    }

    // -------------------------------------------------------
    // 3️⃣ No tokens found fallback ✅
    // -------------------------------------------------------
    if (tokens.length === 0) {
      return res.json({
        success: false,
        message: "No users found with FCM tokens in this gym.",
        gymCode,
      });
    }

    // -------------------------------------------------------
    // 4️⃣ Send notification via Firebase ✅
    // -------------------------------------------------------
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });

    console.log("📣 Notification sent, count ✅:", result.successCount);

    return res.json({
      success: true,
      sentBy: req.clerkUser.email,
      gymCode,
      resultCount: result.successCount,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error("❌ Notification error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error sending notification" });
  }
});

module.exports = router;
