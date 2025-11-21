"use client";

import { useEffect } from "react";
import { messaging } from "@/firebase/firebase";
import { onMessage } from "firebase/messaging";

export default function NotificationListener() {
  useEffect(() => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log("📩 Foreground Notification: ", payload);

      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo.png",
      });
    });
  }, []);

  return null;
}
