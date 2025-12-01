require("dotenv").config({ path: "../.env" });

const admin = require("firebase-admin");

// 1. Initialize Firebase Admin once
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🟢 Firebase Admin Initialized");
  } catch (err) {
    console.error("❌ Firebase Init Error:", err.message);
    process.exit(1);
  }
}

// 2. Function to send notification via Firebase Admin
async function sendFCMNotificationAdmin(tokenObject, title, body, data = {}) {
  const { token, platform } = tokenObject;

  const message = {
    notification: { title, body },
    data,
    token,
  };

  if (platform === "ios") {
    message.apns = {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    };
  } else if (platform === "android") {
    message.android = {
      priority: "high",
      notification: { channelId: "default_channel_id", sound: "default" },
    };
  }

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ FCM Sent:", response);
    return { success: true, response };
  } catch (err) {
    console.error("❌ FCM Error:", err.message);
    return { success: false, error: err.message };
  }
}

// 3. 🔥 MANUAL TEST CALL — You can copy token and test real notification on device
async function runManualTest() {
  const phoneToken =
    "fca2nm0GQnexV_2uEzVVp8:APA91bEkqmOf0FaxeJv_0XXom4PfUllZ_ji4GCdnKQejmjP43vGU8ZMCP0NclaNDshqNnTzYTPqrM4408llFMRYJFn1BWYSIwlqfnPGki1RGtnLBG7TEovM";
  // 👈 Paste your real device token here

  if (!phoneToken || phoneToken.includes("PASTE")) {
    console.error("⚠️ Please paste a valid phone FCM token in runManualTest()");
    return;
  }

  await sendFCMNotificationAdmin(
    { token: phoneToken, platform: "android" },
    "Workout Updated",
    "Your trainer assigned a new workout",
    { screen: "WorkoutPlan", memberId: "12345" }
  );
}

// 4. Export function if you want to call this from routes later
module.exports = {
  sendFCMNotificationAdmin,
  runManualTest,
};

// 5. Run Manual Test when executing this file directly
if (require.main === module) {
  runManualTest().catch(console.error);
}
