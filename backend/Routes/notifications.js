const express = require("express");
const GymApproval = require("../models/GymApproval");
const admin = require("../firebaseAdmin");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");

const router = express.Router();

router.post("/send", verifyClerkToken, async (req, res) => {
  const { userId, title, body, gymCode } = req.body;

  if (!title || !body || !gymCode) {
    return res.status(400).json({ success: false, message: "title, body, gymCode required" });
  }

  try {
    let tokens = [];

    if (userId === "all") {
      const gymUsers = await ClerkUser.find({ gymCode });
      tokens = [...new Set(gymUsers.flatMap(u => u.fcmTokens.map(f => f.token)))];
    } else {
      const gymUser = await ClerkUser.findById(userId);
      if (!gymUser || gymUser.gymCode !== gymCode) {
        return res.status(403).json({ success: false, message: "User not in this gym" });
      }
      tokens = gymUser.fcmTokens.map(f => f.token);
    }

    if (!tokens.length) {
      return res.json({ success: false, message: "No FCM tokens stored for this user/gym" });
    }

    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body }
    });

    return res.json({
      success: true,
      sentBy: req.clerkUser.email,
      resultCount: result.successCount,
      failureCount: result.failureCount,
      message: "Notification sent successfully ✅"
    });

  } catch (err) {
    console.error("❌ Notification send:", err.message);
    res.status(500).json({ success:false, message:"Server error" });
  }
});

module.exports = router;
