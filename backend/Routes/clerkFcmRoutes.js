const express = require("express");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const router = express.Router();

router.post("/save-fcm-token", verifyClerkToken, async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.clerkUser.sub; // Clerk ID

  try {
    const user = await ClerkUser.findOneAndUpdate(
      { sub: userId },
      { fcmToken },
      { new: true }
    );

    res.json({ success: true, message: "FCM token saved", user });
  } catch (err) {
    console.error("❌ Error saving FCM token:", err);
    res.status(500).json({ success: false, err });
  }
});

module.exports = router;
