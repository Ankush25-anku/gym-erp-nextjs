"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import AdminDashboard from "../../../components/child/AdminDashboard";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const role = user?.publicMetadata?.role || localStorage.getItem("userRole");

    if (role === "admin") {
      setIsAuthorized(true);
    } else {
      router.replace("/login");
    }
  }, [isLoaded, user, router]);

  if (!isAuthorized) return null;

  return <AdminDashboard />;
}
