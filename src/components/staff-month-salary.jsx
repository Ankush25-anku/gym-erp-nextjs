"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { Button, Spinner, Form } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SalaryWithAttendance() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [gymCode, setGymCode] = useState("");
  const [category, setCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState([]);

  // ✅ Load gymCode from localStorage or Clerk user
  useEffect(() => {
    if (!user) return;
    const email = user?.primaryEmailAddress?.emailAddress;
    const role = localStorage.getItem("userRole") || "staff";
    const gymKey = `joinedGymCode_${role}_${email}`;
    const storedGym = localStorage.getItem(gymKey);
    setGymCode(storedGym || "");
  }, [user]);

  const getClerkToken = async () => {
    if (!isLoaded || !isSignedIn) return null;
    return await getToken();
  };

  const handleFetch = async () => {
    if (!category) return alert("Please select a category.");
    if (!gymCode) return alert("Gym code missing.");

    setLoading(true);
    try {
      const token = await getClerkToken();
      const selectedDate = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );

      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category/salary-with-attendance`,
        {
          params: {
            gymCode,
            date: selectedDate.toISOString(),
            role: category.toLowerCase(),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setSalaryData(res.data.data || []);
      } else {
        setSalaryData([]);
        alert(res.data.message || "No data found");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      alert("Error fetching salary data.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Deduction = (Absent days × per-day pay)
  const calculateDeduction = (totalAmount, absentDays) => {
    const perDay = totalAmount / 30;
    return (perDay * absentDays).toFixed(2);
  };

  const calculateNetSalary = (totalAmount, absentDays) => {
    const deducted = calculateDeduction(totalAmount, absentDays);
    return (totalAmount - deducted).toFixed(2);
  };

  const totalAllSalaries = salaryData.reduce(
    (sum, s) => sum + (s.totalAmount || 0),
    0
  );

  const totalAllNet = salaryData.reduce((sum, s) => {
    const absent = s.attendance?.Absent || 0;
    const net = calculateNetSalary(s.totalAmount, absent);
    return sum + Number(net);
  }, 0);

  const handlePaySlip = async (fullName, role, month, year) => {
    try {
      const token = await getToken();

      const url = `${API_BASE}/api/payslip/generate?gymCode=${gymCode}&fullName=${fullName}&role=${role}&month=${month}&year=${year}`;

      // Open PDF in new tab
      window.open(url, "_blank");
    } catch (err) {
      console.error("Pay slip error:", err);
      alert("Error generating pay slip.");
    }
  };

  const downloadSlip = async (item) => {
    try {
      const token = await getToken();

      const res = await axios.get(
        `${API_BASE}/api/payslip/${
          item.staffEmail
        }/${selectedMonth.getFullYear()}/${selectedMonth.getMonth() + 1}`,
        {
          responseType: "arraybuffer", // IMPORTANT: use arraybuffer, not blob
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Open PDF in new tab
      window.open(url, "_blank");
    } catch (err) {
      console.error("❌ Payslip download failed:", err);
      alert("Error generating payslip.");
    }
  };

  const exportCSV = () => {
    if (!salaryData || salaryData.length === 0) {
      alert("No salary data to export.");
      return;
    }

    const rows = [];

    // Header Row
    rows.push([
      "Gym Code",
      "Name",
      "Role",
      "Month",
      "Salary (₹)",
      "Deducted (₹)",
      "Net Salary (₹)",
      "Present",
      "Absent",
      "Leave",
      "Half Day",
      "Casual Leave",
      "Sick Leave",
    ]);

    const monthText = `${
      selectedMonth.getMonth() + 1
    }-${selectedMonth.getFullYear()}`;

    // Data rows
    salaryData.forEach((item) => {
      const a = item.attendance || {};
      const deducted = calculateDeduction(item.totalAmount, a.Absent || 0);
      const netSalary = calculateNetSalary(item.totalAmount, a.Absent || 0);

      rows.push([
        gymCode,
        item.fullName,
        item.role,
        monthText,
        item.totalAmount,
        deducted,
        netSalary,
        a.Present || 0,
        a.Absent || 0,
        a.Leave || 0,
        a["Half Day"] || 0,
        a["Casual Leave"] || 0,
        a["Sick Leave"] || 0,
      ]);
    });

    // Convert to CSV format
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `salary_report_${
        selectedMonth.getMonth() + 1
      }-${selectedMonth.getFullYear()}.csv`
    );
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 rounded-4 bg-white shadow-sm">
      <h4 className="fw-bold text-dark mb-4">💼 Salary & Attendance Report</h4>

      {/* Filters */}
      <div className="d-flex flex-wrap align-items-end gap-4 mb-4">
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

        <div>
          <Button variant="primary" onClick={handleFetch} disabled={loading}>
            {loading ? "Fetching..." : "Fetch"}
          </Button>
        </div>

        <div>
          <Button
            variant="outline-success"
            onClick={exportCSV}
            disabled={salaryData.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive border rounded-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading salary data...</p>
          </div>
        ) : salaryData.length > 0 ? (
          <table className="table table-hover align-middle text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Salary (₹)</th>
                <th>Deducted (₹)</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Half Day</th>
                <th>Casual Leave</th>
                <th>Sick Leave</th>
                <th>Net Salary (₹)</th>
                <th>Pay Slip</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.map((item, index) => {
                const a = item.attendance || {};
                const totalDays =
                  a.Present +
                  a.Absent +
                  a.Leave +
                  a["Half Day"] +
                  a["Casual Leave"] +
                  a["Sick Leave"];

                const deducted = calculateDeduction(
                  item.totalAmount,
                  a.Absent || 0
                );
                const netSalary = calculateNetSalary(
                  item.totalAmount,
                  a.Absent || 0
                );

                return (
                  <tr key={index}>
                    <td className="fw-semibold text-start">{item.fullName}</td>
                    <td>{item.role}</td>
                    <td>{item.totalAmount.toLocaleString()}</td>
                    <td>{deducted}</td>
                    <td>{a.Present || 0}</td>
                    <td>{a.Absent || 0}</td>
                    <td>{a.Leave || 0}</td>
                    <td>{a["Half Day"] || 0}</td>
                    <td>{a["Casual Leave"] || 0}</td>
                    <td>{a["Sick Leave"] || 0}</td>
                    <td className="fw-bold text-success">{netSalary}</td>
                    <td>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => downloadSlip(item)}
                      >
                        Slip
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {/* ✅ Total Row */}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-muted py-4">
            Select category & month, then click Fetch.
          </p>
        )}
      </div>
    </div>
  );
}
