const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");
const axios = require("axios");

// --------------------------------------------------------
// 1. INITIALIZE FIREBASE ADMIN SDK (Run once)
// --------------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendFCMNotificationAdmin(tokenObject, title, body, data = {}) {
  const { token, platform } = tokenObject;

  const message = {
    notification: { title, body },
    data: data,
    token: token,
  };

  if (platform === "ios") {
    message.apns = {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    };
  } else if (platform === "android") {
    message.android = {
      priority: "high",
      notification: {
        channelId: "default_channel_id",
        sound: "default",
      },
    };
  }

  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ FCM Success (${platform}):`, response);
    return { success: true, response, token };
  } catch (error) {
    console.log(`❌ FCM Error (${platform}):`, error.message);
    return { success: false, error: error.message, token };
  }
}

// --------------------------------------------------------
// 2. FETCH USERS + THEIR FCM TOKENS FROM BACKEND DB
// --------------------------------------------------------
async function fetchUsersFCMTokens() {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL; // ✅ use env
    const res = await axios.get(`${API_BASE}/api/users`);
    const users = res.data?.users || [];

    const allTokenObjects = [];

    users.forEach((u) => {
      if (Array.isArray(u.fcmTokens)) {
        u.fcmTokens.forEach((t) => {
          allTokenObjects.push({
            token: t.token,
            platform: t.platform || "android",
            createdAt: t.createdAt,
          });
        });
      }
    });

    console.log("📌 Total devices found in DB:", allTokenObjects.length);
    return allTokenObjects;
  } catch (err) {
    console.error("🔥 Token Fetch Failed:", err.message);
    return [];
  }
}

// --------------------------------------------------------
// 3. TEST SENDING NOTIFICATION TO ALL USER DEVICES
// --------------------------------------------------------
async function sendTestMessageToMultipleDevicesAdmin() {
  const tokenObjects = await fetchUsersFCMTokens();

  if (!tokenObjects.length) {
    console.log("⚠ No FCM devices stored in DB!");
    return;
  }

  const notificationTitle = "🔥 FCM Test Message";
  const notificationBody = "This was sent using Firebase Admin SDK ✅";
  const customData = { screen: "DashboardTest" };

  const sendPromises = tokenObjects.map((tokenObj) =>
    sendFCMNotificationAdmin(
      tokenObj,
      notificationTitle,
      notificationBody,
      customData
    )
  );

  console.log("--- 🚀 Sending notification to all devices ---");
  const results = await Promise.all(sendPromises);
  console.log("--- ✅ All sends completed ---");

  // --------------------------------------------------------
  // 4. REMOVE INVALID TOKENS FROM DB IF FAILED
  // --------------------------------------------------------
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  for (const r of results) {
    if (!r.success && r.error?.includes("invalid-registration-token")) {
      console.log("🗑 Removing invalid token:", r.token);

      await axios.post(`${API_BASE}/api/users/remove-fcm-token`, {
        fcmToken: r.token,
      });
    }
  }
}

sendTestMessageToMultipleDevicesAdmin().catch(console.error);
