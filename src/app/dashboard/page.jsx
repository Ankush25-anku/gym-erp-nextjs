"use client";

import SyncClerkUser from "../../components/SyncClerkUser";
import { UserButton } from "@clerk/nextjs";

export default function Dashboard() {
  return (
    <div>
      <SyncClerkUser /> {/* ⏳ This will immediately redirect based on role */}
      <p>🔄 Redirecting based on role...</p>
      <UserButton afterSignOutUrl="/login" />
    </div>
  );
}
