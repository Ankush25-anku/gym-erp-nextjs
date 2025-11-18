"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Spinner, Button, Form, Nav } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

/* ------------------------- MonthYearPickerInput (Dynamic) ------------------------- */
function MonthYearPickerInput({ value, onChange, mode = "month" }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = value.getFullYear();
  const years = Array.from(
    { length: 50 },
    (_, i) => new Date().getFullYear() - i
  );
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

  return (
    <div className="position-relative d-inline-block" ref={pickerRef}>
      <div
        className="border rounded px-3 py-2 bg-white d-flex align-items-center justify-content-between"
        style={{ cursor: "pointer", width: 180 }}
        onClick={() => setShowPicker(!showPicker)}
      >
        <span>
          {mode === "month"
            ? value.toLocaleString("default", {
                month: "short",
                year: "numeric",
              })
            : currentYear}
        </span>
        <FaCalendarAlt />
      </div>

      {showPicker && (
        <div
          className="position-absolute bg-white border rounded p-2 shadow-sm mt-1"
          style={{ zIndex: 10, width: 200, maxHeight: 260, overflowY: "auto" }}
        >
          {mode === "month" ? (
            <>
              <div className="text-center fw-bold mb-2">Select Month</div>
              <div
                className="d-grid"
                style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}
              >
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="text-center py-1 rounded"
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        i === value.getMonth() ? "#0d6efd" : "transparent",
                      color: i === value.getMonth() ? "#fff" : "#000",
                    }}
                    onClick={() => {
                      onChange(new Date(value.getFullYear(), i, 1));
                      setShowPicker(false);
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
              <hr />
              <div className="text-center fw-bold mb-2">Select Year</div>
              <div
                className="d-grid"
                style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}
              >
                {years.map((y) => (
                  <div
                    key={y}
                    className={`text-center py-1 rounded ${
                      y === currentYear ? "bg-primary text-white" : "text-dark"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      onChange(new Date(y, value.getMonth(), 1));
                      setShowPicker(false);
                    }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-center fw-bold mb-2">Select Year</div>
              <div
                className="d-grid"
                style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}
              >
                {years.map((y) => (
                  <div
                    key={y}
                    className={`text-center py-1 rounded ${
                      y === currentYear ? "bg-primary text-white" : "text-dark"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      onChange(new Date(y, 0, 1));
                      setShowPicker(false);
                    }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- Main Component ------------------------- */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminMemberPayments() {
  const { getToken, isLoaded } = useAuth();
  const [adminFullName, setAdminFullName] = useState("");
  const [role, setRole] = useState("");
  const [gymCode, setGymCode] = useState("");
  const [payments, setPayments] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ✅ Fetch Admin Info & Gym Code */
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        if (!isLoaded) return;
        const token = await getToken();
        if (!token) return;

        const userRes = await axios.get(`${API_BASE}/api/clerkusers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAdminFullName(userRes.data.fullName || "Admin");
        setRole(userRes.data.role || "admin");

        const gymRes = await axios.get(`${API_BASE}/api/gym/my-gym`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const code = gymRes.data?.gym?.gymCode;
        if (code) setGymCode(code);
        else throw new Error("Gym code missing");
      } catch (err) {
        console.error("❌ Error fetching admin info:", err);
        setError("Could not load admin or gym details.");
      }
    };
    fetchAdminInfo();
  }, [isLoaded, getToken]);

  /* ✅ Fetch All Payments */
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (!isLoaded || !gymCode) return;
        setLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${API_BASE}/api/member-subscriptions/details/${gymCode}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPayments(res.data.payments || []);
      } catch (err) {
        console.error("❌ Error fetching payments:", err);
        setError("Failed to load payment data.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [gymCode, getToken, isLoaded]);

  /* --- Loading and Error --- */
  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading payment details...</p>
      </div>
    );

  if (error)
    return <div className="alert alert-danger text-center mt-4">{error}</div>;

  /* --- Render --- */
  return (
    <div className="p-4 bg-white rounded-4 shadow-sm">
      <h3 className="fw-bold mb-4 text-dark">💰 Member Payment Report</h3>

      {/* Tabs */}
      <Nav variant="tabs" activeKey={viewMode} onSelect={(k) => setViewMode(k)}>
        <Nav.Item>
          <Nav.Link eventKey="month">Monthly View</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="year">Yearly View</Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-3 align-items-end my-4">
        <div>
          <Form.Label className="fw-semibold text-dark">
            Select {viewMode === "month" ? "Month" : "Year"}
          </Form.Label>
          <MonthYearPickerInput
            value={selectedMonth}
            onChange={setSelectedMonth}
            mode={viewMode === "month" ? "month" : "year"} // ✅ Dynamic mode
          />
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => setSelectedMonth(new Date())}
          >
            Reset to Current
          </Button>
        </div>
      </div>

      {/* Tables */}
      {viewMode === "month" ? (
        <MonthlyTable payments={payments} selectedMonth={selectedMonth} />
      ) : (
        <YearlyTable payments={payments} selectedMonth={selectedMonth} />
      )}
    </div>
  );
}

/* ------------------------- Monthly Table ------------------------- */
/* ------------------------- Monthly Table ------------------------- */
function MonthlyTable({ payments, selectedMonth }) {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: numDays }, (_, i) => i + 1);

  // ✅ Group by member
  const memberMap = {};
  payments.forEach((p) => {
    const paidDate = new Date(p.paidDate);
    if (paidDate.getMonth() === month && paidDate.getFullYear() === year) {
      const key = p.email;
      if (!memberMap[key]) {
        memberMap[key] = {
          name: p.memberName,
          email: p.email,
          plan: p.planName,
          dailyAmounts: {},
          total: 0,
        };
      }
      const day = paidDate.getDate();
      memberMap[key].dailyAmounts[day] =
        (memberMap[key].dailyAmounts[day] || 0) + (p.amount || 0);
      memberMap[key].total += p.amount || 0;
    }
  });

  const members = Object.values(memberMap);

  return (
    <div className="bg-light p-3 rounded-4 border border-secondary overflow-auto">
      <table className="table table-bordered align-middle text-center">
        <thead className="table-primary sticky-top">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Plan</th>
            {daysInMonth.map((d) => (
              <th key={d}>{d}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td
                colSpan={daysInMonth.length + 4}
                className="text-center text-muted py-4"
              >
                ⚠️ No payments available for this month.
              </td>
            </tr>
          ) : (
            members.map((m, idx) => (
              <tr key={idx}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.plan}</td>
                {daysInMonth.map((d) => {
                  const amount = m.dailyAmounts[d] || 0;
                  return (
                    <td
                      key={d}
                      style={{
                        backgroundColor: amount ? "#d4edda" : "#f8f9fa",
                        color: amount ? "#155724" : "#6c757d",
                        fontWeight: amount ? "bold" : "normal",
                      }}
                    >
                      {amount > 0 ? `₹${amount}` : 0}
                    </td>
                  );
                })}
                <td
                  className="fw-bold"
                  style={{ color: m.total > 0 ? "#28a745" : "#6c757d" }}
                >
                  ₹{m.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------- Yearly Table ------------------------- */
function YearlyTable({ payments, selectedMonth }) {
  const year = selectedMonth.getFullYear();

  // ✅ Group by member (only if they paid during selected year)
  const memberMap = {};
  payments.forEach((p) => {
    const paidDate = new Date(p.paidDate);
    if (paidDate.getFullYear() === year) {
      const key = p.email;
      if (!memberMap[key]) {
        memberMap[key] = {
          name: p.memberName,
          email: p.email,
          plan: p.planName,
          monthlyAmounts: Array(12).fill(0),
          total: 0,
        };
      }
      const monthIndex = paidDate.getMonth();
      memberMap[key].monthlyAmounts[monthIndex] += p.amount || 0;
      memberMap[key].total += p.amount || 0;
    }
  });

  const members = Object.values(memberMap);

  return (
    <div className="bg-light p-3 rounded-4 border border-secondary overflow-auto">
      <table className="table table-bordered align-middle text-center">
        <thead className="table-primary sticky-top">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Plan</th>
            {[
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
            ].map((m) => (
              <th key={m}>{m}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={15} className="text-center text-muted py-4">
                ⚠️ No payments available for this year.
              </td>
            </tr>
          ) : (
            members.map((m, idx) => (
              <tr key={idx}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.plan}</td>
                {m.monthlyAmounts.map((amt, i) => (
                  <td
                    key={i}
                    style={{
                      backgroundColor: amt ? "#d4edda" : "#f8f9fa",
                      color: amt ? "#155724" : "#6c757d",
                      fontWeight: amt ? "bold" : "normal",
                    }}
                  >
                    {amt > 0 ? `₹${amt}` : 0}
                  </td>
                ))}
                <td
                  className="fw-bold"
                  style={{ color: m.total > 0 ? "#28a745" : "#6c757d" }}
                >
                  ₹{m.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
