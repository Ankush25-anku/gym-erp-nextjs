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
        fcmToken: { $exists: true, $ne: "" },
      });
      tokens = users.map((u) => u.fcmToken);
    } else {
      const user = await ClerkUser.findById(userId);
      if (user?.fcmToken) {
        tokens = [user.fcmToken];
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
    });
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    res.status(500).json({ success: false, err });
  }
});

module.exports = router;
