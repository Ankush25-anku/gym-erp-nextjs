const express = require("express");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");

const router = express.Router();

router.post("/save-fcm-token", verifyClerkToken, async (req, res) => {
  const { fcmToken } = req.body;
  const clerkId = req.clerkUser.sub; // ✅ Clerk user ID from token

  if (!fcmToken) {
    return res
      .status(400)
      .json({ success: false, message: "FCM token is required" });
  }

  try {
    const user = await ClerkUser.findOneAndUpdate(
      { sub: clerkId }, // ✅ Match Clerk ID
      { fcmToken }, // ✅ Save/update FCM token
      { new: true, upsert: false }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    return res.json({
      success: true,
      message: "FCM token saved successfully",
      user: {
        sub: user.sub,
        email: user.email,
        fcmToken: user.fcmToken,
      },
    });
  } catch (err) {
    console.error("❌ Error saving FCM token:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error saving FCM token" });
  }
});

module.exports = router;
