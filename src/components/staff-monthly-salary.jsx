"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Spinner } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StaffMonthlySalary() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [gymCode, setGymCode] = useState("");
  const [category, setCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [gridData, setGridData] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(31);

  // Load gym code from localStorage
  useEffect(() => {
    if (!user) return;

    const email = user?.primaryEmailAddress?.emailAddress;
    const role = localStorage.getItem("userRole") || "staff";
    const gymKey = `joinedGymCode_${role}_${email}`;

    setGymCode(localStorage.getItem(gymKey) || "");
  }, [user]);

  const getClerkToken = async () => {
    if (!isLoaded || !isSignedIn) return null;
    return await getToken();
  };

  // FETCH MONTHLY SALARY + DAILY GRID
  const handleFetch = async () => {
    if (!category) return alert("Please select a category.");
    if (!gymCode) return alert("Gym code missing.");

    setLoading(true);

    try {
      const token = await getClerkToken();
      const date = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      ).toISOString();

      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category/salary-attendance-daily`,
        {
          params: {
            gymCode,
            date,
            role: category.toLowerCase(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setGridData(res.data.data);
        setDaysInMonth(res.data.daysInMonth);
      } else {
        setGridData([]);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Error fetching monthly salary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-4 bg-white shadow-sm">
      <h4 className="fw-bold text-dark mb-4">
        📅 Staff Monthly Salary (Daily Attendance Grid)
      </h4>

      {/* ===================== FILTERS ===================== */}
      <div className="d-flex flex-wrap gap-4 mb-4 align-items-end">
        {/* Category */}
        <div>
          <Form.Label className="fw-semibold">Category</Form.Label>
          <Form.Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            <option value="Staff">Staff</option>
            <option value="Trainer">Trainer</option>
          </Form.Select>
        </div>

        {/* Month Picker */}
        <div>
          <Form.Label className="fw-semibold">Month</Form.Label>
          <div className="d-flex align-items-center border rounded px-3 py-2">
            <FaCalendarAlt className="me-2 text-muted" />
            <input
              type="month"
              value={`${selectedMonth.getFullYear()}-${String(
                selectedMonth.getMonth() + 1
              ).padStart(2, "0")}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setSelectedMonth(new Date(year, month - 1, 1));
              }}
              className="border-0 bg-transparent w-100"
            />
          </div>
        </div>

        {/* Fetch Button */}
        <div>
          <Button variant="primary" onClick={handleFetch} disabled={loading}>
            {loading ? "Fetching..." : "Fetch"}
          </Button>
        </div>
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="table-responsive">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Loading data...</p>
          </div>
        ) : gridData.length === 0 ? (
          <p className="text-center text-muted py-4">
            Select category + month and click Fetch
          </p>
        ) : (
        <table className="table table-bordered text-center">
  <thead className="bg-light">
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Salary</th>
      <th>Deducted</th>
      {Array.from({ length: daysInMonth }).map((_, i) => (
        <th key={i + 1}>{i + 1}</th>
      ))}
    </tr>
  </thead>

  <tbody>
    {gridData.map((row, idx) => (
      <tr key={idx}>
        <td className="fw-bold text-start">{row.fullName}</td>
        <td>{row.role}</td>
        <td>{row.salary}</td>
        <td className="text-danger fw-bold">{row.deducted}</td>

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const status = row.daily[i + 1] || "NA";
          const bg =
            status === "P"
              ? "#1FCB4A"
              : status === "A"
              ? "#FF5C5C"
              : "#EAEAEA";

          return (
            <td
              key={i + 1}
              style={{
                background: bg,
                color: status === "NA" ? "#555" : "white",
                fontWeight: "bold",
              }}
            >
              {status}
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>

        )}
      </div>
    </div>
  );
}
