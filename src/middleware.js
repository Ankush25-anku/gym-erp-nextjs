// src/middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect everything except Next.js internals, static files, and auth pages
    "/((?!_next/|.*\\..*|/login|/signup|/after-signup).*)",

    // Protect API routes
    "/api/:path*",

    // ✅ Protect all role-based routes
    "/member/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/superadmin/:path*",
  ],
};
