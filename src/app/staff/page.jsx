"use client";

import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useAuth } from "@clerk/nextjs";
import MasterLayout from "../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DASHBOARD_STATS_API = `${API_BASE}/api/admin/stats`;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    members: 0,
    trainers: 0,
    staff: 0,
    expenses: 0,
    memberCheckins: 0,
    staffTrainerAttendance: 0,
  });

  const [adminFullName, setAdminFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  // ✅ Fetch Clerk User Info for Full Name
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        if (!isLoaded) return;

        const token = await getToken();
        if (!token) {
          console.error("❌ No Clerk token found");
          return;
        }

        const res = await axios.get(`${API_BASE}/api/clerkusers/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("🟢 Clerk User Data (Admin):", res.data);

        if (res.data.fullName) {
          setAdminFullName(res.data.fullName);
          localStorage.setItem("userFullName", res.data.fullName);
        } else {
          setAdminFullName("Admin");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", res.data.role || "admin");
        }
      } catch (err) {
        console.error("❌ Error fetching admin Clerk user info:", err);
        setAdminFullName("Admin");
      }
    };

    fetchAdminInfo();
  }, [getToken, isLoaded]);

  // ✅ Fetch Admin Stats
  useEffect(() => {
    if (isLoaded && isSignedIn) fetchDashboardData();
  }, [isLoaded, isSignedIn]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) return;

      const res = await axios.get(DASHBOARD_STATS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};
      setStats({
        members: data.members ?? 0,
        trainers: data.trainers ?? 0,
        staff: data.staff ?? 0,
        expenses: data.expenses ?? 0,
        memberCheckins: data.memberCheckins ?? 0,
        staffTrainerAttendance: data.staffTrainerAttendance ?? 0,
      });
    } catch (err) {
      console.error("❌ Failed to fetch admin stats:", err);
      setError("Failed to load admin dashboard. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading admin dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-danger text-center mt-4" role="alert">
        {error}
      </div>
    );

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

        {/* --- Overview Cards --- */}
        <div className="row g-4 mb-4">
          <StatCard
            icon="mdi:account-group"
            color="primary"
            title="Total Members"
            value={stats.members}
          />
          <StatCard
            icon="mdi:human-male-board"
            color="success"
            title="Total Trainers"
            value={stats.trainers}
          />
          <StatCard
            icon="mdi:account-tie"
            color="info"
            title="Total Staff"
            value={stats.staff}
          />
          <StatCard
            icon="mdi:cash-multiple"
            color="danger"
            title="Total Expenses"
            value={`₹${stats.expenses.toLocaleString("en-IN")}`}
          />
          <StatCard
            icon="mdi:account-check"
            color="warning"
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

        {/* --- Quick Actions --- */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Quick Actions</h5>
            <div className="d-flex flex-wrap gap-3">
              {[
                {
                  title: "Add Member",
                  desc: "Register a new gym member",
                  icon: "mdi:account-plus",
                },
                {
                  title: "Add Trainer",
                  desc: "Onboard a new trainer",
                  icon: "mdi:human-male-board",
                },
                {
                  title: "Record Expense",
                  desc: "Track gym spending",
                  icon: "mdi:cash-minus",
                },
                {
                  title: "Generate Report",
                  desc: "View performance insights",
                  icon: "mdi:file-chart",
                },
                {
                  title: "Manage Gym Settings",
                  desc: "Update gym information",
                  icon: "mdi:cog",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="border rounded p-3 flex-grow-1"
                  style={{ minWidth: "220px" }}
                >
                  <div className="fw-semibold">
                    <Icon icon={item.icon} width={20} /> {item.title}
                  </div>
                  <div className="text-muted small">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
};

/* --- Reusable Stat Card --- */
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

export default AdminDashboard;
