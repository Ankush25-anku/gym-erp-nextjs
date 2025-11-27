const express = require("express");
const GymApproval = require("../models/GymApproval");
const admin = require("../firebaseAdmin");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");

const router = express.Router();

router.post("/send", verifyClerkToken, async (req, res) => {
  const { userId, title, body, gymCode } = req.body;

  if (!title || !body || !gymCode) {
    return res
      .status(400)
      .json({ success: false, message: "Title, body & gymCode are required" });
  }

  try {
    let tokens = [];

    // ✅ Collect users by gymApproval emails only
    const approvals = await GymApproval.find({
      gymCode,
      status: "approved",
    }).select("adminEmail");
    const emails = approvals.map((a) => a.adminEmail.toLowerCase());

    const users = await ClerkUser.find({ email: { $in: emails } }).select(
      "fcmTokens"
    );

    if (userId === "all") {
      tokens = users.flatMap((u) => u.fcmTokens.map((t) => t.token));
    } else {
      const targetUser = await ClerkUser.findById(userId);
      if (
        !targetUser ||
        emails.includes(targetUser.email.toLowerCase()) === false
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "User not in this gym approval list",
          });
      }
      tokens = targetUser.fcmTokens.map((t) => t.token);
    }

    if (tokens.length === 0) {
      return res.json({
        success: false,
        message: "No FCM tokens found for this gym/users",
      });
    }

    const result = await admin
      .messaging()
      .sendEachForMulticast({ tokens, notification: { title, body } });

    return res.json({
      success: true,
      sentBy: req.clerkUser.email,
      resultCount: result.successCount,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error("❌ Send route:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error sending notification" });
  }
});

module.exports = router;
