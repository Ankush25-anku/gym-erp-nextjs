// app/layout.jsx
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { UserProvider } from "../context/UserContext";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Gym ERP System",
  description:
    "Manage your gym efficiently with members, trainers, workouts, and finances.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <UserProvider>
        <html
          lang="en"
          className={`${geistSans.variable} ${geistMono.variable}`}
          suppressHydrationWarning
        >
          <head>
            <Script
              src="https://checkout.razorpay.com/v1/checkout.js"
              strategy="beforeInteractive"
            />
          </head>
          <body className="antialiased bg-gray-50">{children}</body>
        </html>
      </UserProvider>
    </ClerkProvider>
  );
}
