const express = require("express");
const admin = require("../firebaseAdmin");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const router = express.Router();

router.post("/send", verifyClerkToken, async (req, res) => {
  const { userId, title, message } = req.body;

  try {
    let tokens = [];

    if (userId === "all") {
      const users = await ClerkUser.find({
        "fcmTokens.token": { $exists: true, $ne: "" },
      });

      users.forEach((u) => {
        u.fcmTokens.forEach((t) => tokens.push(t.token));
      });
    } else {
      const user = await ClerkUser.findById(userId);
      if (user) {
        user.fcmTokens.forEach((t) => tokens.push(t.token));
      }
    }

    if (tokens.length === 0) {
      return res.json({
        success: false,
        message: "No users found with FCM token",
      });
    }

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: message },
    });

    res.json({
      success: true,
      sentBy: req.clerkUser.email,
      message: "Notification sent successfully",
      sentTokensCount: tokens.length,
    });
  } catch (err) {
    console.error("❌ Error sending notification:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
