import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Allow public pages
    "/((?!_next/|.*\\..*|/login|/signup|/sign-in|/sign-up|/after-signin|/after-signup).*)",

    // Protect API routes
    "/api/:path*",

    // Protect role-based dashboards
    "/member/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/superadmin/:path*",
    "/trainer/:path*", // OK
  ],
};
