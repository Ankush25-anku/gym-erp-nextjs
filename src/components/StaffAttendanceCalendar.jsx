"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { Button, Spinner } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StaffAttendanceCalendarPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [gymCode, setGymCode] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [staffId, setStaffId] = useState("");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // ✅ Load gymCode and staffId from localStorage
  useEffect(() => {
    if (!user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    const role = "staff";

    const gymKey = `joinedGymCode_${role}_${email}`;
    const storedGym = localStorage.getItem(gymKey);
    setGymCode(storedGym || "");

    const storedStaffId = localStorage.getItem(`staffId_${email}`);
    if (storedStaffId) setStaffId(storedStaffId);
  }, [user]);

  // ✅ Generate days in selected month
  const getDaysInMonth = (month, year) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: numDays }, (_, i) => i + 1);
  };

  const daysInMonth = getDaysInMonth(selectedMonth.getMonth(), selectedMonth.getFullYear());

  // ✅ Fetch staff attendance
  const fetchAttendance = async () => {
    if (!user || !gymCode) return;

    setLoading(true);
    try {
      const email = user.primaryEmailAddress?.emailAddress;
      const token = await getToken();
      if (!token) return alert("Please login again.");

      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      const queryParams = new URLSearchParams({
        gymCode,
        month,
        year,
        ...(staffId ? { staffId } : { staffEmail: email }),
      });

      const res = await axios.get(
        `${API_BASE}/api/admin/staff-attendance/staff-calendar?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📥 Staff calendar response:", res.data);
      setAttendanceData(res.data.success ? res.data.attendance || [] : []);
    } catch (err) {
      console.error("❌ Error fetching staff attendance:", err);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gymCode && user) fetchAttendance();
  }, [gymCode, selectedMonth]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
      case "P":
        return "bg-success text-white";
      case "Absent":
      case "A":
        return "bg-danger text-white";
      case "Leave":
      case "L":
      case "Casual Leave":
      case "CL":
        return "bg-warning text-dark";
      case "Sick Leave":
      case "SL":
        return "bg-info text-dark";
      case "HD":
      case "Half Day":
        return "bg-secondary text-white";
      default:
        return "bg-light text-muted";
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  return (
    <div className="p-3 p-md-4 bg-white rounded-4 shadow-sm attendance-calendar-container">
      {/* Header Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => changeMonth(-1)}
        >
          <FaChevronLeft />
        </Button>

        <h5 className="fw-bold text-center mb-0 text-truncate">
          {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
        </h5>

        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => changeMonth(1)}
        >
          <FaChevronRight />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid border rounded-3 p-2 p-md-3">
        <div
          className="d-grid text-center fw-semibold text-secondary border-bottom pb-2"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            fontSize: "0.9rem",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-secondary mt-2">Loading attendance...</p>
          </div>
        ) : (
          <div
            className="d-grid mt-2"
            style={{
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "5px",
            }}
          >
            {/* Empty cells for start of month */}
            {Array.from(
              {
                length: new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth(),
                  1
                ).getDay(),
              },
              (_, i) => (
                <div key={`empty-${i}`} className="p-3 bg-transparent"></div>
              )
            )}

            {/* Attendance Cells */}
            {daysInMonth.map((day) => {
              const currentDate = new Date(
                selectedMonth.getFullYear(),
                selectedMonth.getMonth(),
                day
              );
              const record = attendanceData.find(
                (a) =>
                  new Date(a.date).toDateString() === currentDate.toDateString()
              );
              const status = record ? record.status : "NA";

              return (
                <div
                  key={day}
                  className={`p-2 p-md-3 rounded-3 text-center border fw-semibold ${getStatusColor(
                    status
                  )}`}
                  style={{ fontSize: "0.8rem" }}
                >
                  <div className="fw-bold">{day}</div>
                  <small className="d-block">{status}</small>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ Legend */}
      <div className="text-center mt-4">
        <h6 className="fw-bold mb-3 text-primary">Legend</h6>
        <div className="d-flex flex-wrap justify-content-center gap-2 gap-md-3">
          <span className="badge bg-success">P - Present</span>
          <span className="badge bg-danger">A - Absent</span>
          <span className="badge bg-warning text-dark">L - Leave</span>
          <span className="badge bg-info text-dark">SL - Sick Leave</span>
          <span className="badge bg-secondary">HD - Half Day</span>
          <span className="badge bg-light text-dark border">NA - Not Marked</span>
        </div>
      </div>
    </div>
  );
}
