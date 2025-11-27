const express = require("express");
const router = express.Router();
const ClerkUser = require("../models/ClerkUser"); // ✅ your existing model

router.post("/api/users/save-fcm-token", async (req, res) => {
  try {
    const { userId, fcmToken, platform } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ message: "userId and fcmToken are required" });
    }

    // ✅ Find user by Clerk 'sub'
    const user = await ClerkUser.findOne({ sub: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found in DB" });
    }

    // ✅ Check if token already exists
    const tokenExists = user.fcmTokens.some((t) => t.token === fcmToken);

    if (!tokenExists) {
      user.fcmTokens.push({ token: fcmToken, platform });
      await user.save();
    }

    return res.json({
      message: tokenExists ? "Token already saved" : "FCM token saved successfully",
      fcmTokens: user.fcmTokens,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
