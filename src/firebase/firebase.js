// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA4m3Mvi0J_bC2R_ZcoOoh3qMgkSBWNV_E",
  authDomain: "m-erp-8b426.firebaseapp.com",
  projectId: "m-erp-8b426",
  storageBucket: "m-erp-8b426.firebasestorage.app",
  messagingSenderId: "36421732542",
  appId: "1:36421732542:web:5f6135e062c932d80ab6ef",
  measurementId: "G-QF0M44WJ90"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const messaging =
  typeof window !== "undefined" ? getMessaging(firebaseApp) : null;
