const express = require("express");
const admin = require("../firebaseAdmin");
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const Notification = require("../models/NotificationModel"); // ✅ DB model to store notifications
const router = express.Router();

// 1️⃣ Send Notification (your original route but now stores notif too)
router.post("/send", verifyClerkToken, async (req, res) => {
  const { userId, title, message, gymCode, data } = req.body;

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

    // ✅ Sending actual FCM notifications
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: message },
      data: data || {},
    });

    // ✅ Store notif in DB for bell dropdown UI
    await Notification.create({
      gymCode: gymCode || null,
      receiverId: userId === "all" ? "all" : userId,
      title,
      message,
      data: data || null,
      sentBy: req.clerkUser.email,
      read: false,
    });

    res.json({
      success: true,
      sentBy: req.clerkUser.email,
      message: "Notification sent and stored",
      sentTokensCount: tokens.length,
    });
  } catch (err) {
    console.error("❌ Error sending notification:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2️⃣ Fetch stored notifications for UI (Bell dropdown)
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const userMongoId = req.clerkUser.mongoId;
    const gymCode = req.query.gymCode;

    const query = {
      $or: [{ receiverId: "all" }, { receiverId: userMongoId }],
    };

    if (gymCode) query.gymCode = gymCode;

    const notifications = await Notification.find(query).sort({
      createdAt: -1,
    });

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3️⃣ Get unread count for bell badge
router.get("/unread-count", verifyClerkToken, async (req, res) => {
  try {
    const userMongoId = req.clerkUser.mongoId;
    const gymCode = req.query.gymCode;

    const count = await Notification.countDocuments({
      read: false,
      $or: [{ receiverId: "all" }, { receiverId: userMongoId }],
      ...(gymCode && { gymCode }),
    });

    res.json({ success: true, count });
  } catch (err) {
    console.error("❌ Error fetching unread count:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4️⃣ Mark notification read when user clicks in UI
router.post("/mark-read/:id", verifyClerkToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error("❌ Error marking read:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
