"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function MyProgress() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "member") {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) return null;

  const activities = [
    {
      name: "John Doe",
      action: "Checked in",
      time: "10 mins ago",
      initials: "JD",
    },
    {
      name: "Sarah Wilson",
      action: "Completed workout",
      time: "25 mins ago",
      initials: "SW",
    },
    {
      name: "Mike Johnson",
      action: "Payment received",
      time: "1 hour ago",
      initials: "MJ",
    },
    {
      name: "Emily Davis",
      action: "Booked session",
      time: "2 hours ago",
      initials: "ED",
    },
  ];

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">My Progress</h2>
        <p className="text-muted mb-4">
          Welcome back, Mike Member! Here's what's happening at your gym today.
        </p>

        {/* Top Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:heart-pulse" width={24} />
                </div>
                <div>
                  <small className="text-muted">Days Active</small>
                  <h5 className="mb-0">45</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:chart-line" width={24} />
                </div>
                <div>
                  <small className="text-muted">Workouts</small>
                  <h5 className="mb-0">68</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="bg-orange text-white rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: 50, height: 50 }}
                >
                  <Icon icon="mdi:scale-bathroom" width={24} />
                </div>
                <div>
                  <small className="text-muted">Weight Lost</small>
                  <h5 className="mb-0">8 lbs</h5>
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
                  <Icon icon="mdi:calendar-star" width={24} />
                </div>
                <div>
                  <small className="text-muted">Streak</small>
                  <h5 className="mb-0">12 days</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Actions */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold">Recent Activity</h5>
                <p className="text-muted mb-4">
                  Latest gym activities and updates
                </p>
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

          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold">Quick Actions</h5>
                <p className="text-muted mb-4">Common tasks and shortcuts</p>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <Link
                      href="/member/attendance"
                      className="text-decoration-none text-dark"
                    >
                      <div className="border rounded-3 p-3 h-100">
                        <div className="fw-semibold">Check Attendance</div>
                        <div className="text-muted small">
                          View daily attendance
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="col-sm-6">
                    <Link
                      href="/member/schedule"
                      className="text-decoration-none text-dark"
                    >
                      <div className="border rounded-3 p-3 h-100">
                        <div className="fw-semibold">Schedule</div>
                        <div className="text-muted small">
                          View today&apos;s schedule
                        </div>
                      </div>
                    </Link>
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
