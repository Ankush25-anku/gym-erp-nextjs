"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import MasterLayout from "../../masterLayout/MasterLayout";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MemberDashboardPage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();

  const [memberFullName, setMemberFullName] = useState("");
  const [membershipDetails, setMembershipDetails] = useState(null);
  const [stats, setStats] = useState({
    attendanceThisMonth: 18,
    totalWorkoutsCompleted: 12,
    caloriesBurned: 4800,
    activeDays: 22,
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        if (!isLoaded) return;

        const token = await getToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // ✅ Fetch member profile (from your backend ClerkUser or Member collection)
        const res = await axios.get(`${API_BASE}/api/clerkusers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("🟢 Member Data:", res.data);

        setMemberFullName(res.data.fullName || "Member");

        // Example: mock membership info (replace with real backend route)
        const membership = {
          planName: "Gold Plan",
          expiryDate: "2025-12-15",
          remainingDays: 40,
          status: "Active",
        };
        setMembershipDetails(membership);

        // Example: mock activity log (replace with backend API if available)
        const recent = [
          {
            title: "Attended Yoga Class",
            description: "Morning yoga session with Trainer Maya",
            time: "Today, 7:00 AM",
          },
          {
            title: "Workout Completed",
            description: "Full body workout plan completed",
            time: "Yesterday, 6:30 PM",
          },
          {
            title: "Payment Successful",
            description: "Renewed Gold Plan for 3 months",
            time: "3 days ago",
          },
        ];
        setActivities(recent);
      } catch (err) {
        console.error("❌ Error fetching member dashboard info:", err);
      }
    };

    fetchMemberInfo();
  }, [getToken, isLoaded, router]);

  return (
    <MasterLayout>
      <div className="container-fluid p-4 bg-light min-vh-100">
        {/* --- Header Section --- */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold">Member Dashboard</h2>
            <p className="text-muted">
              Welcome back,{" "}
              <span className="fw-semibold text-dark">
                {memberFullName || "Member"}
              </span>
              ! Here’s your personalized fitness overview.
            </p>
          </div>
        </div>

        {/* --- Membership Details --- */}
        {membershipDetails && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body d-flex flex-wrap justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1">{membershipDetails.planName}</h5>
                <p className="text-muted mb-1">
                  Status:{" "}
                  <span
                    className={
                      membershipDetails.status === "Active"
                        ? "text-success fw-semibold"
                        : "text-danger fw-semibold"
                    }
                  >
                    {membershipDetails.status}
                  </span>
                </p>
                <p className="text-muted mb-0">
                  Expires on:{" "}
                  <span className="fw-semibold">
                    {membershipDetails.expiryDate}
                  </span>{" "}
                  ({membershipDetails.remainingDays} days remaining)
                </p>
              </div>
              <button className="btn btn-outline-primary mt-3 mt-md-0">
                Renew Plan
              </button>
            </div>
          </div>
        )}

        {/* --- Progress Cards --- */}
        <div className="row mb-4">
          {[
            {
              label: "Attendance This Month",
              value: `${stats.attendanceThisMonth} days`,
              icon: "📅",
              color: "success",
            },
            {
              label: "Workouts Completed",
              value: stats.totalWorkoutsCompleted,
              icon: "💪",
              color: "primary",
            },
            {
              label: "Calories Burned",
              value: `${stats.caloriesBurned} kcal`,
              icon: "🔥",
              color: "danger",
            },
            {
              label: "Active Days",
              value: stats.activeDays,
              icon: "🏃‍♂️",
              color: "info",
            },
          ].map((item, index) => (
            <div className="col-md-3 mb-3" key={index}>
              <div className="card border-0 shadow-sm text-center py-3">
                <div className="fs-1">{item.icon}</div>
                <h6 className="fw-semibold text-muted mt-2">{item.label}</h6>
                <h4 className={`fw-bold text-${item.color}`}>{item.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* --- Recent Activity & Quick Actions --- */}
        <div className="row">
          {/* Recent Activity */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold">Recent Activity</h5>
                <p className="text-muted small mb-3">
                  Your latest workouts, check-ins, and payments
                </p>

                {activities.length > 0 ? (
                  activities.map((item, i) => (
                    <div
                      key={i}
                      className="d-flex justify-content-between align-items-center py-2 border-bottom"
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
                          style={{ width: 40, height: 40 }}
                        >
                          {item.title.charAt(0)}
                        </div>
                        <div className="ms-3">
                          <div className="fw-semibold">{item.title}</div>
                          <div className="text-muted small">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-muted small">{item.time}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold">Quick Actions</h5>
                <p className="text-muted small mb-3">
                  Access your most used features
                </p>
                <div className="d-flex flex-column gap-3">
                  <div className="border rounded p-3">
                    <div className="fw-semibold">View Workout Plan</div>
                    <div className="text-muted small">
                      Check your personalized exercises and goals
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="fw-semibold">View Attendance</div>
                    <div className="text-muted small">
                      Track your daily attendance progress
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="fw-semibold">Upcoming Schedule</div>
                    <div className="text-muted small">
                      See upcoming classes and sessions
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="fw-semibold">Update Profile</div>
                    <div className="text-muted small">
                      Manage your personal info and preferences
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
