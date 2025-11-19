"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MasterLayout from "../../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function TrainerDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    // 🔐 Redirect to login if not logged in or wrong role
    if (!token || role !== "trainer") {
      router.push("/login");
    }
  }, [router]);

  const activities = [
    { name: "John Doe", action: "Checked in", time: "10 mins ago", initials: "JD" },
    { name: "Sarah Wilson", action: "Completed workout", time: "25 mins ago", initials: "SW" },
    { name: "Mike Johnson", action: "Payment received", time: "1 hour ago", initials: "MJ" },
    { name: "Emily Davis", action: "Booked session", time: "2 hours ago", initials: "ED" },
  ];

  const quickActions = [
    { title: "Check Attendance", desc: "View daily attendance", href: "/trainer/attendance" },
    { title: "My Members", desc: "View assigned members", href: "/trainer/members" },
    { title: "Schedule", desc: "View today's schedule", href: "/trainer/schedule" },
  ];

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">Trainer Dashboard</h2>
        <p className="text-muted mb-4">
          Welcome back, Sarah Trainer! Here's what's happening at your gym today.
        </p>

        {/* Top Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:account-group" width={24} />
                </div>
                <div>
                  <small className="text-muted">My Members</small>
                  <h5 className="mb-0">28</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:calendar-check" width={24} />
                </div>
                <div>
                  <small className="text-muted">Sessions Today</small>
                  <h5 className="mb-0">6</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-warning text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:calendar-week" width={24} />
                </div>
                <div>
                  <small className="text-muted">This Week</small>
                  <h5 className="mb-0">24</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-purple text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:star-outline" width={24} />
                </div>
                <div>
                  <small className="text-muted">Rating</small>
                  <h5 className="mb-0">4.8★</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="row g-4">
          {/* Recent Activity */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold">Recent Activity</h5>
                <p className="text-muted mb-4">Latest gym activities and updates</p>
                {activities.map((item, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center mb-3"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="bg-light rounded-circle text-primary fw-bold d-flex justify-content-center align-items-center"
                        style={{ width: 40, height: 40 }}
                      >
                        {item.initials}
                      </div>
                      <div>
                        <div className="fw-semibold">{item.name}</div>
                        <div className="text-muted small">{item.action}</div>
                      </div>
                    </div>
                    <span className="bg-light text-dark small px-2 py-1 rounded-pill">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold">Quick Actions</h5>
                <p className="text-muted mb-4">Common tasks and shortcuts</p>
                <div className="row g-3">
                  {quickActions.map((action, idx) => (
                    <div className="col-sm-6" key={idx}>
                      <Link href={action.href} className="text-decoration-none text-dark">
                        <div className="border rounded-3 p-3 h-100 hover-shadow">
                          <div className="fw-semibold">{action.title}</div>
                          <div className="text-muted small">{action.desc}</div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
