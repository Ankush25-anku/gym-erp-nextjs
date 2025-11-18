"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { Button, Spinner, Form } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MonthYearPicker.css";

function MonthYearPicker({ selected, onChange }) {
  const [view, setView] = useState("month");
  const [currentYear, setCurrentYear] = useState(selected.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selected.getMonth());
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = Array.from({ length: 200 }, (_, i) => 1900 + i);
  const toggleView = () => setView(view === "month" ? "year" : "month");
  const selectYear = (year) => {
    setCurrentYear(year);
    setView("month");
  };
  const selectMonth = (index) => {
    setCurrentMonth(index);
    onChange(new Date(currentYear, index, 1));
  };

  return (
    <div className="monthyearpicker">
      <div className="myp-header" onClick={toggleView}>
        {months[currentMonth]} {currentYear}
      </div>
      {view === "month" ? (
        <div className="myp-grid">
          {months.map((m, i) => (
            <div
              key={i}
              className={`myp-cell ${i === currentMonth ? "active" : ""}`}
              onClick={() => selectMonth(i)}
            >
              {m}
            </div>
          ))}
        </div>
      ) : (
        <div className="myp-grid year-view">
          {years.map((y) => (
            <div
              key={y}
              className={`myp-cell ${y === currentYear ? "active" : ""}`}
              onClick={() => selectYear(y)}
            >
              {y}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthYearPickerInput({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const pickerRef = useRef(null);
  const togglePicker = () => setShowPicker(!showPicker);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleDateChange = (date) => {
    setSelectedDate(date);
    onChange(date);
    setShowPicker(false);
  };

  return (
    <div className="monthyearpicker-input" ref={pickerRef}>
      <div className="myp-input-field" onClick={togglePicker}>
        <span className="myp-input-text">
          {selectedDate.toLocaleString("default", {
            month: "short",
            year: "numeric",
          })}
        </span>
        <FaCalendarAlt className="myp-input-icon" />
      </div>
      {showPicker && (
        <div className="myp-dropdown">
          <MonthYearPicker
            selected={selectedDate}
            onChange={handleDateChange}
          />
        </div>
      )}
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StaffMonthlyAttendancePage({ gymCodeProp }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [gymCode, setGymCode] = useState(gymCodeProp || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [attendanceMatrix, setAttendanceMatrix] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Load gym code
  useEffect(() => {
    if (!user) return;
    const email = user?.primaryEmailAddress?.emailAddress;
    const role = localStorage.getItem("userRole") || "staff";
    const gymKey = `joinedGymCode_${role}_${email}`;
    const storedGym = localStorage.getItem(gymKey);
    setGymCode(storedGym || "");
  }, [user, gymCodeProp]);

  const getClerkToken = async () => {
    if (!isLoaded || !isSignedIn) return null;
    return await getToken();
  };

  useEffect(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    setDaysInMonth(Array.from({ length: numDays }, (_, i) => i + 1));
  }, [selectedMonth]);

  const handleFetch = async () => {
    if (!selectedCategory) return alert("Please select a category.");
    if (!gymCode) return alert("No gym code found.");

    setLoading(true);
    localStorage.removeItem("attendanceMatrix");
    const token = await getClerkToken();
    if (!token) return alert("Please login again.");

    try {
      // Fetch staff list
      const staffEndpoint =
        selectedCategory === "Trainer"
          ? `${API_BASE}/api/admin/trainer/list?gymCode=${gymCode}`
          : `${API_BASE}/api/admin/staff-attendance/staff-list?gymCode=${gymCode}`;

      const staffRes = await axios.get(staffEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list =
        selectedCategory === "Trainer"
          ? staffRes.data.trainers || []
          : staffRes.data.staff || [];

      setStaffList(list);

      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      // Fetch attendance data
      const attendanceRes = await axios.get(
        `${API_BASE}/api/admin/staff-attendance/monthly?gymCode=${gymCode}&month=${month}&year=${year}&category=${selectedCategory}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const attendance = attendanceRes.data.attendance || [];

      const matrix = list.map((staff) => {
        const row = {
          name: staff.fullName,
          email: staff.requesterEmail, // ✅ added email column
          role: staff.role,
        };
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLeave = 0;

        daysInMonth.forEach((day) => {
          const dateRecord = attendance.find((a) => {
            const recordDate = new Date(a.date);
            return (
              recordDate.getDate() === day &&
              recordDate.getMonth() === selectedMonth.getMonth() &&
              recordDate.getFullYear() === selectedMonth.getFullYear()
            );
          });

          if (!dateRecord) {
            row[day] = "NA";
            return;
          }

          const staffEntry = dateRecord.attendance.find(
            (att) =>
              att.staffId?.toString() === staff._id?.toString() ||
              att.staffEmail === staff.requesterEmail
          );

          if (staffEntry) {
            row[day] = staffEntry.status;

            if (["Present", "P"].includes(staffEntry.status)) {
              totalPresent += 1;
            } else if (["Absent", "A"].includes(staffEntry.status)) {
              totalAbsent += 1;
            } else if (
              ["Leave", "L", "Casual Leave", "CL", "Sick Leave", "SL"].includes(
                staffEntry.status
              )
            ) {
              totalLeave += 1;
            }
          } else {
            row[day] = "NA";
          }
        });

        row.total = totalPresent;
        row.totalAbsent = totalAbsent;
        row.totalLeave = totalLeave;
        return row;
      });

      setAttendanceMatrix(matrix);
      localStorage.setItem("attendanceMatrix", JSON.stringify(matrix));
      localStorage.setItem("selectedCategory", selectedCategory);
      localStorage.setItem("selectedMonth", selectedMonth.toISOString());
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err);
      alert("Error fetching attendance data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const savedMatrix = localStorage.getItem("attendanceMatrix");
    const savedCategory = localStorage.getItem("selectedCategory");
    const savedMonth = localStorage.getItem("selectedMonth");

    if (savedMatrix && savedCategory && savedMonth) {
      setAttendanceMatrix(JSON.parse(savedMatrix));
      setSelectedCategory(savedCategory);
      setSelectedMonth(new Date(savedMonth));
    }
  }, []);

  return (
    <div className="p-4 rounded-4 shadow-sm bg-white">
      <h3 className="fw-bold mb-4 text-dark">📅 Monthly Attendance Report</h3>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-4 align-items-end mb-4">
        <div>
          <Form.Label className="fw-semibold text-dark">Category</Form.Label>
          <Form.Select
            className="border-secondary"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            <option value="Staff">Staff</option>
            <option value="Trainer">Trainer</option>
          </Form.Select>
        </div>

        {/* Month Picker */}
        <div>
          <Form.Label className="fw-semibold text-dark">Month</Form.Label>
          <MonthYearPickerInput
            value={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
          />
        </div>

        <div>
          <Button
            variant="primary"
            className="fw-semibold"
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? "Loading..." : "Fetch"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-light p-3 rounded-4 border border-secondary overflow-auto">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-secondary mt-2">Loading attendance data...</p>
          </div>
        ) : attendanceMatrix.length > 0 ? (
          <>
            <table className="table table-bordered align-middle text-center">
              <thead className="table-primary">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  {daysInMonth.map((d) => (
                    <th key={`day-${d}`}>{d}</th>
                  ))}
                  <th>Total No Of present</th>
                  <th>Total Absent</th>
                  <th>Total Leave</th>
                </tr>
              </thead>
              <tbody>
                {attendanceMatrix.map((row, idx) => (
                  <tr key={`row-${idx}`}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.role}</td>
                    {daysInMonth.map((d) => {
                      const status = row[d];
                      let display = status;
                      let className = "";

                      switch (status) {
                        case "Present":
                        case "P":
                          display = "P";
                          className = "status-present";
                          break;
                        case "Absent":
                        case "A":
                          display = "A";
                          className = "status-absent";
                          break;
                        case "Leave":
                        case "L":
                          display = "L";
                          className = "status-leave";
                          break;
                        case "H":
                        case "HD":
                          display = "HD";
                          className = "status-halfday";
                          break;
                        case "Casual Leave":
                        case "CL":
                          display = "CL";
                          className = "status-casual";
                          break;
                        case "Sick Leave":
                        case "SL":
                          display = "SL";
                          className = "status-sick";
                          break;
                        default:
                          className = "status-na";
                      }

                      return (
                        <td
                          key={`cell-${idx}-${d}`}
                          className={`attendance-cell ${className}`}
                        >
                          {display || "-"}
                        </td>
                      );
                    })}
                    <td className="fw-semibold">{row.total}</td>
                    <td className="fw-semibold text-danger">
                      {row.totalAbsent}
                    </td>
                    <td className="fw-semibold text-danger">
                      {row.totalLeave}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ Attendance Legend placed here */}
            <div className="attendance-legend text-center my-4">
              <h6 className="fw-bold mb-3 text-dark">Attendance Legend</h6>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <div className="legend-item status-present">
                  P: <span>Present</span>
                </div>
                <div className="legend-item status-absent">
                  A: <span>Absent</span>
                </div>
                <div className="legend-item status-leave">
                  L: <span>Leave</span>
                </div>
                <div className="legend-item status-halfday">
                  HD: <span>Half Day</span>
                </div>
                <div className="legend-item status-casual">
                  CL: <span>Casual Leave</span>
                </div>
                <div className="legend-item status-sick">
                  SL: <span>Sick Leave</span>
                </div>
                <div className="legend-item status-na text-dark bg-light">
                  NA: <span>Not Assigned</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-muted py-3">
            Select category & month, then click Fetch.
          </p>
        )}
      </div>
    </div>
  );
}
