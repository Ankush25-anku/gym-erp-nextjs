const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

// --------------------------------------------------------
// 1. INITIALIZE ADMIN SDK (Run once at server startup)
// --------------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Optional: Add other configurations like databaseURL if needed
  });
}

async function sendFCMNotificationAdmin(tokenObject, title, body, data = {}) {
  const { token, platform } = tokenObject;

  // Base message structure
  const message = {
    notification: { title, body },
    data: data,
    token: token,
  };

  // Add platform-specific configuration for behavior control
  if (platform === "ios") {
    message.apns = {
      headers: {
        "apns-priority": "10", // High priority
      },
      payload: {
        aps: {
          sound: "default",
        },
      },
    };
  } else if (platform === "android") {
    message.android = {
      priority: "high",
      notification: {
        channelId: "default_channel_id", // Required for Android 8+
        sound: "default",
      },
    };
  }

  try {
    // 2. Send the message using the simplified API
    const response = await admin.messaging().send(message);

    // console.log(✅ FCM Success for ${platform} token:, response);
    return response;
  } catch (error) {
    // Admin SDK provides clean error objects
    // console.error(❌ FCM Error for ${platform} token:, error.message);
    // Examine error.code (e.g., messaging/invalid-registration-token) to remove bad tokens
  }
}

// ----------------------------------------------------------------------
// Example Usage (Simulating sending a notification to all user's devices)
// ----------------------------------------------------------------------

async function sendTestMessageToMultipleDevicesAdmin() {
  const userTokensFromDB = [
    {
      token:
        "fmKas0asT3qxfPApab2RR4:APA91bGkZ0F0edI9Doz_7vaUTPYWooTVKCicZHivMyU2vbf9mK4HQK43wkaZ5S4qEH72kO7VdeySWzaJrjhUlr1rKQD-8teUbx8jkPwMcGHR6OewRT7HWSg",
      platform: "android",
      createdAt: new Date("2025-01-01"),
    },
  ];

  const notificationTitle = "Admin SDK Test!";
  const notificationBody = "This was sent using the Firebase Admin SDK.";
  const customAppData = {
    screen: "Assignments",
    courseId: "MATH101",
  };

  const sendPromises = userTokensFromDB.map((tokenObj) => {
    return sendFCMNotificationAdmin(
      tokenObj,
      notificationTitle,
      notificationBody,
      customAppData
    );
  });

  console.log("--- Initiating parallel sends via Admin SDK ---");
  await Promise.all(sendPromises);
  console.log("--- All sends completed ---");
}

// Execute the test function
sendTestMessageToMultipleDevicesAdmin().catch(console.error);
