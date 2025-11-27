const express = require("express");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");

const router = express.Router();

// SAVE FCM TOKEN ✅ (Push into fcmTokens array)
router.post("/save-fcm-token", verifyClerkToken, async (req, res) => {
  const { fcmToken, platform, gymCode } = req.body;
  const clerkId = req.clerkUser.sub;

  if (!fcmToken) {
    return res
      .status(400)
      .json({ success: false, message: "FCM token is required" });
  }

  try {
    const user = await ClerkUser.findOneAndUpdate(
      { sub: clerkId },
      {
        $set: { gymCode: gymCode || "" }, // save gymCode
        $push: { fcmTokens: { token: fcmToken, platform: platform || "web" } }, // ✅ FIXED
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "FCM token saved successfully",
      user: { sub: user.sub, email: user.email, fcmTokens: user.fcmTokens },
    });
  } catch (err) {
    console.error("❌ Error saving FCM:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error saving FCM token" });
  }
});

module.exports = router;
