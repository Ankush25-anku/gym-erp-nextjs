// app/layout.jsx
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// ✅ Import your custom UserProvider
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
      {/* ✅ Wrap everything inside UserProvider */}
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
          <body className="antialiased">
            <header className="flex justify-end items-center p-4 gap-4 h-16 border-b">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <UserButton
                  afterSignOutUrl="/login"
                  afterProfileUrl="/" // optional, can point to "/" or role-specific page
                />
              </SignedIn>
            </header>

            {/* ✅ Children of both Clerk + User contexts */}
            <main>{children}</main>
          </body>
        </html>
      </UserProvider>
    </ClerkProvider>
  );
}
