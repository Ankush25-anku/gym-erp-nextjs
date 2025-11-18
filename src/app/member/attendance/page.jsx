"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MasterLayout from "../../../masterLayout/MasterLayout";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import dayjs from "dayjs";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const userId = "6866548e45c2d50b2a6ef25f"; // ✅ Hardcoded userId

export default function MyAttendance() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayAttendance, setDayAttendance] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "member") {
      router.push("/login");
    } else {
      fetchAttendance();
    }
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/userAttendance?userId=${userId}`);
      const records = res.data || [];

      setAttendance(records);

      const events = records.map((record) => ({
        title: record.userId?.fullname || record.status,
        date: dayjs(record.date).format("YYYY-MM-DD"),
        backgroundColor: "#198754",
        borderColor: "#198754",
        textColor: "#fff",
      }));

      setCalendarEvents(events);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const handleDateClick = (arg) => {
    const date = arg.date;
    setSelectedDate(date);
    const filtered = attendance.filter((record) =>
      dayjs(record.date).isSame(dayjs(date), "day")
    );
    setDayAttendance(filtered);
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">My Attendance Calendar</h2>
        <p className="text-muted mb-4">Click a date to view your attendance details</p>

        <div className="row g-4">
          <div className="col-md-7">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              dateClick={handleDateClick}
              height="auto"
            />
          </div>

          <div className="col-md-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold mb-3">
                  {selectedDate
                    ? dayjs(selectedDate).format("MMMM D, YYYY")
                    : "Select a date"}
                </h5>
                {dayAttendance.length > 0 ? (
                  <ul className="list-group">
                    {dayAttendance.map((a, i) => (
                      <li
                        key={i}
                        className="list-group-item d-flex justify-content-between"
                      >
                        <span>{a.userId?.fullname || a.status}</span>
                        <span className="text-muted">
                          {dayjs(a.time).format("hh:mm A")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No attendance for this date.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
