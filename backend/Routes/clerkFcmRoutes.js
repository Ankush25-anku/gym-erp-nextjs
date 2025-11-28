const express = require("express");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const router = express.Router();

router.post("/save-fcm-token", verifyClerkToken, async (req, res) => {
  const { userMongoId, fcmToken, platform } = req.body;

  if (!userMongoId || !fcmToken) {
    return res
      .status(400)
      .json({ success: false, message: "Missing Mongo ID or FCM Token" });
  }

  try {
    const user = await ClerkUser.findById(userMongoId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in DB" });
    }

    // Push token into fcmTokens array if not already stored
    const exists = user.fcmTokens.some((t) => t.token === fcmToken);
    if (!exists) {
      user.fcmTokens.push({
        token: fcmToken,
        platform: platform || platform || "web",
      });
      await user.save();
    }

    console.log(
      "🔥 Stored FCM token for Mongo _id:",
      user._id,
      "Token:",
      fcmToken
    );

    res.json({
      success: true,
      message: "FCM token stored successfully ✅",
      user,
    });
  } catch (err) {
    console.error("❌ Error saving FCM token:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
