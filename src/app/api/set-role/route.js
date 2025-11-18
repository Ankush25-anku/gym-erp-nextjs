import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    // 🧠 Clerk SDK can export clerkClient as a function in some versions
    const client =
      typeof clerkClient === "function" ? await clerkClient() : clerkClient;

    // ✅ Update metadata safely
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { role },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /api/set-role:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
