// src/utils/saveFcmToken.js
import { messaging } from "@/firebase/firebase";
import { getToken } from "firebase/messaging";
import axios from "axios";

export async function saveFcmToken(email, role) {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return;
    }

    const fcmToken = await getToken(messaging, {
      vapidKey:
        "BIY61Hwr3Ay6Rzb5XESuOY01Cp4yUoPN-L9TyUOoM2wS-jfVjSMXRNE7tlf-JplTV7d3MwpHBvgRjaCyyc6NXbs",
    });
    if (!fcmToken) {
      console.log("❌ No FCM token received");
      return;
    }

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/save-token`,
      {
        email,
        role,
        token: fcmToken,
      }
    );

    console.log("🔥 Token saved in backend:", fcmToken);
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
}
