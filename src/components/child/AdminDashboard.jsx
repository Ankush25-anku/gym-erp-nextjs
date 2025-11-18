"use client";

import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Spinner, Button, Alert } from "react-bootstrap";
import { useAuth } from "@clerk/nextjs";
import MasterLayout from "../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const { getToken, isLoaded } = useAuth();

  const [adminFullName, setAdminFullName] = useState("");
  const [gymCode, setGymCode] = useState("");
  const [stats, setStats] = useState({
    members: 0,
    staff: 0,
    trainers: 0,
    revenue: 0,
    expenses: 0,
    memberCheckins: 0,
    staffTrainerAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noGymFound, setNoGymFound] = useState(false);

  /** ✅ Fetch Admin Info + Gym Code */
  const fetchAdminInfo = useCallback(async () => {
    try {
      if (!isLoaded) return;
      const token = await getToken();
      if (!token) return;

      // ✅ 1️⃣ Fetch Clerk user info
      const userRes = await axios.get(`${API_BASE}/api/clerkusers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fullName = userRes.data?.fullName || "Admin";
      setAdminFullName(fullName);

      if (typeof window !== "undefined") {
        localStorage.setItem("userFullName", fullName);
        localStorage.setItem("userRole", userRes.data?.role || "admin");
      }

      // ✅ 2️⃣ Fetch Gym Info
      const gymRes = await axios.get(`${API_BASE}/api/gym/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("🏋️ Gym Data:", gymRes.data);

      if (!gymRes.data?.gym?.gymCode) {
        console.warn("⚠️ No gym found for this admin.");
        setNoGymFound(true);
        setGymCode("");
        setError("No gym found. Please create or join a gym first.");
        setLoading(false);
        return;
      }

      setGymCode(gymRes.data.gym.gymCode);
      setNoGymFound(false);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching admin or gym info:", err);
      setError("Failed to load admin or gym info.");
      setLoading(false);
    }
  }, [isLoaded, getToken]);

  /** ✅ Fetch Dashboard Data */
  const fetchDashboardData = useCallback(async () => {
    if (!isLoaded || !gymCode) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      // Run all API requests in parallel for speed ⚡
      const [gymStatsRes, revenueRes, expenseRes, checkinRes] =
        await Promise.all([
          axios.get(`${API_BASE}/api/gym/stats/${gymCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/member-subscriptions/total/${gymCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/expenses?gymCode=${gymCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(
            `${API_BASE}/api/admin/staff-attendance/checked-in-count/${gymCode}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

      const totalMembers = gymStatsRes.data?.totalMembers || 0;
      const totalStaff = gymStatsRes.data?.totalStaff || 0;
      const totalRevenue = revenueRes.data?.totalAmount || 0;
      const totalExpenses =
        expenseRes.data?.expenses?.reduce(
          (sum, e) => sum + (e.amount || 0),
          0
        ) || 0;
      const checkedInCount = checkinRes.data?.checkedInCount || 0;

      setStats({
        members: totalMembers,
        staff: totalStaff,
        revenue: totalRevenue,
        expenses: totalExpenses,
        memberCheckins: 0,
        staffTrainerAttendance: checkedInCount,
      });
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard stats. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, getToken, gymCode]);

  /** 🔁 Initialize Fetches */
  useEffect(() => {
    fetchAdminInfo();
  }, [fetchAdminInfo]);

  useEffect(() => {
    if (gymCode) fetchDashboardData();
  }, [gymCode, fetchDashboardData]);

  /* --- UI States --- */
  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2 text-muted">Loading admin dashboard...</p>
      </div>
    );

  if (noGymFound)
    return (
      <MasterLayout>
        <div className="container mt-5 text-center">
          <Alert variant="warning" className="mx-auto w-75">
            <h5 className="fw-bold">No Gym Found</h5>
            <p>
              You haven’t joined or created a gym yet. Please create or join a
              gym to access your admin dashboard.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.assign("/gyms/add")}
            >
              ➕ Create Gym
            </Button>
          </Alert>
        </div>
      </MasterLayout>
    );

  if (error)
    return (
      <MasterLayout>
        <div className="container mt-5 text-center">
          <Alert variant="danger" className="mx-auto w-75">
            <h5 className="fw-bold">Error</h5>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchAdminInfo}>
              Retry
            </Button>
          </Alert>
        </div>
      </MasterLayout>
    );

  /* --- UI --- */
  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">Admin Dashboard</h2>
        <p className="text-muted mb-4">
          Welcome back,{" "}
          <span className="fw-semibold text-dark">
            {adminFullName || "Admin"}
          </span>
          ! Here’s your gym’s performance overview.
        </p>

        <div className="row g-4 mb-4">
          <StatCard
            icon="mdi:account-group"
            color="primary"
            title="Total Members"
            value={stats.members}
          />
          <StatCard
            icon="mdi:account-tie"
            color="info"
            title="Total Staff"
            value={stats.staff}
          />
          <StatCard
            icon="mdi:cash-plus"
            color="warning"
            title="Total Revenue"
            value={`₹${stats.revenue.toLocaleString("en-IN")}`}
          />
          <StatCard
            icon="mdi:cash-minus"
            color="danger"
            title="Total Expenses"
            value={`₹${stats.expenses.toLocaleString("en-IN")}`}
          />
          <StatCard
            icon="mdi:account-check"
            color="success"
            title="Members Checked-in Today"
            value={stats.memberCheckins}
          />
          <StatCard
            icon="mdi:account-tie"
            color="dark"
            title="Staff & Trainers Checked-in"
            value={stats.staffTrainerAttendance}
          />
        </div>
      </div>
    </MasterLayout>
  );
}

/* --- Reusable Stat Card Component --- */
const StatCard = ({ icon, color, title, value }) => (
  <div className="col-lg-4 col-md-6 col-sm-12">
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div
          className={`bg-${color} text-white rounded-circle d-flex justify-content-center align-items-center`}
          style={{ width: 50, height: 50 }}
        >
          <Icon icon={icon} width={24} />
        </div>
        <div>
          <small className="text-muted">{title}</small>
          <h5 className="mb-0">{value}</h5>
        </div>
      </div>
    </div>
  </div>
);
