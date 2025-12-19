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

          <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 antialiased">
            {/* ================= HEADER ================= */}
            <header className="flex items-center justify-between px-6 h-16 border-b bg-white shadow-sm">
              <h2 className="text-lg font-bold text-[#6c47ff]">
                Gym ERP System
              </h2>

              <div className="flex items-center gap-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-full hover:bg-gray-100 transition">
                      Sign In
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button className="px-5 py-2 text-sm font-semibold rounded-full bg-black text-white hover:bg-gray-900 transition">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
                  <UserButton afterSignOutUrl="/login" />
                </SignedIn>
              </div>
            </header>

            {/* ================= MAIN ================= */}
            <main className="flex items-center justify-center px-4 py-16">
              <SignedOut>
                <div className="max-w-2xl text-center">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Welcome to{" "}
                    <span className="text-[#6c47ff]">Gym ERP System</span> 💪
                  </h1>

                  <p className="text-gray-600 text-lg mb-6">
                    Your all-in-one gym management platform to track workouts,
                    attendance, members, trainers, finances, and progress —
                    seamlessly and efficiently.
                  </p>

                  <p className="text-gray-800 font-semibold mb-8">
                    Please sign in or create an account to continue 🔐
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <SignInButton mode="modal">
                      <button className="px-8 py-3 rounded-full font-bold text-white bg-black hover:scale-105 transition shadow-lg">
                        Sign In
                      </button>
                    </SignInButton>

                    <SignUpButton mode="modal">
                      <button className="px-8 py-3 rounded-full font-bold text-black border border-black hover:bg-black hover:text-white transition shadow-lg">
                        Create Account
                      </button>
                    </SignUpButton>
                  </div>
                </div>
              </SignedOut>

              <SignedIn>{children}</SignedIn>
            </main>
          </body>
        </html>
      </UserProvider>
    </ClerkProvider>
  );
}
