const express = require("express");
const router = express.Router();
const ClerkUser = require("../models/ClerkUser");

router.post("/save-fcm-token", async (req, res) => {
  try {
    const { userMongoId, userId, fcmToken, platform } = req.body;

    // Prefer saving using MongoDB _id
    let user = null;

    if (userMongoId) {
      user = await ClerkUser.findById(userMongoId);
      console.log("🔍 Found user by Mongo _id:", user?._id);
    }

    // Fallback: Find by Clerk `sub`
    if (!user && userId) {
      user = await ClerkUser.findOne({ sub: userId });
      console.log("🔍 Found user by Clerk sub:", user?._id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database ❌",
      });
    }

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM Token is required ❌",
      });
    }

    // Check duplicate token
    const tokenExists = user.fcmTokens.some((t) => t.token === fcmToken);

    if (!tokenExists) {
      user.fcmTokens.push({
        token: fcmToken,
        platform: platform || platform || "web",
      });
      await user.save();

      console.log(
        "🟣 FCM Token saved in DB for Mongo _id:",
        user._id,
        "Token:",
        fcmToken
      );
    } else {
      console.log("⚠ Token already exists for user _id:", user._id);
    }

    return res.json({
      success: true,
      message: tokenExists
        ? "FCM Token already saved ⚠"
        : "FCM Token saved successfully ✅",
      fcmTokens: user.fcmTokens,
    });
  } catch (err) {
    console.error("❌ Error saving FCM Token:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error ❌",
    });
  }
});

module.exports = router;
