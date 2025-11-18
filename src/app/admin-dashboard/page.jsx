"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// import MasterLayout from "../../masterLayout/MasterLayout";
import AdminDashboard from "../../components/child/AdminDashboard";
import RevenueGrowthOne from "../../components/child/RevenueGrowthOne";
import EarningStaticOne from "../../components/child/EarningStaticOne";

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

  return (
    <div className="container-fluid mt-4">
      {/* Stat cards and check-ins */}
      <AdminDashboard />

      {/* Charts Row */}
      <div className="row mt-4">
        {/* <RevenueGrowthOne />
          <EarningStaticOne /> */}
      </div>
    </div>
  );
}
