// public/firebase-messaging-sw.js

importScripts(
  "https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyA4m3Mvi0J_bC2R_ZcoOoh3qMgkSBWNV_E",
  authDomain: "m-erp-8b426.firebaseapp.com",
  projectId: "m-erp-8b426",
  messagingSenderId: "36421732542",
  appId: "1:36421732542:web:5f6135e064c932d80ab6ef",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🎉 Background Message: ", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png",
  });
});
