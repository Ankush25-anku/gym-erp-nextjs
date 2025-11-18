"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Spinner, Button, Form, Nav, Table, Alert } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ---------------- MonthYearPickerInput (Reusable) ---------------- */
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
    { length: 30 },
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
          style={{ zIndex: 10, width: 200, maxHeight: 250, overflowY: "auto" }}
        >
          {mode === "month" ? (
            <>
              <div className="fw-bold text-center mb-2">Select Month</div>
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
              <div className="fw-bold text-center mb-2">Select Year</div>
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
              <div className="fw-bold text-center mb-2">Select Year</div>
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

/* ---------------- ExpenseReport (Main Component) ---------------- */
export default function ExpenseReport() {
  const { getToken, isLoaded } = useAuth();
  const [gymCode, setGymCode] = useState("");
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  /* ✅ Fetch Gym Code */
  useEffect(() => {
    const fetchGym = async () => {
      try {
        if (!isLoaded) return;
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/gym/my-gym`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const code = res.data?.gym?.gymCode;
        if (code) {
          setGymCode(code);
          fetchSummary(code, selectedDate.getFullYear());
        }
      } catch (err) {
        console.error("❌ Error fetching gym info:", err);
        setAlert({ type: "danger", message: "Failed to load gym info." });
      }
    };
    fetchGym();
  }, [isLoaded, getToken]);

  /* ✅ Fetch Expense Summary */
  /* ✅ Fetch Expense Summary */
  const fetchSummary = async (code, year) => {
    try {
      setLoading(true);
      const token = await getToken();
      const mode = viewMode; // 'month' or 'year'
      const monthIndex = selectedDate.getMonth();

      let url = `${API_BASE}/api/expenses/summary?gymCode=${code}&year=${year}&mode=${mode}`;
      if (mode === "month") {
        url += `&month=${monthIndex}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSummary(res.data.summary || {});
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      setAlert({ type: "danger", message: "Failed to fetch summary data." });
    } finally {
      setLoading(false);
    }
  };
  // 🔁 Refetch when gymCode, viewMode, or selectedDate changes
  useEffect(() => {
    if (gymCode && isLoaded) {
      fetchSummary(gymCode, selectedDate.getFullYear());
    }
  }, [gymCode, viewMode, selectedDate, isLoaded]);

  /* ✅ Table Rendering Logic */
  return (
    <div className="p-4 bg-white rounded-4 shadow-sm">
      <h3 className="fw-bold mb-4 text-dark">📊 Expense Report</h3>

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
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              if (gymCode) fetchSummary(gymCode, date.getFullYear());
            }}
            mode={viewMode}
          />
        </div>
        <div>
          <Button variant="primary" onClick={() => setSelectedDate(new Date())}>
            Reset to Current
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alert.message && <Alert variant={alert.type}>{alert.message}</Alert>}

      {/* Tables */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading expense data...</p>
        </div>
      ) : viewMode === "month" ? (
        <MonthlyExpenseTable summary={summary} selectedDate={selectedDate} />
      ) : (
        <YearlyExpenseTable summary={summary} selectedDate={selectedDate} />
      )}
    </div>
  );
}

/* ---------------- Monthly Expense Table ---------------- */
/* ---------------- Monthly Expense Table ---------------- */
function MonthlyExpenseTable({ summary, selectedDate }) {
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();
  const daysInMonth = Array.from(
    { length: new Date(year, month + 1, 0).getDate() },
    (_, i) => i + 1
  );

  return (
    <div className="bg-light p-3 rounded-4 border border-secondary overflow-auto">
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-primary">
          <tr>
            <th>Expense Category</th>
            {daysInMonth.map((d) => (
              <th key={d}>{d}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(summary).length > 0 ? (
            Object.entries(summary).map(([category, data]) => {
              let total = 0;
              const dailyData = daysInMonth.map((day) => {
                const value = data[day] || 0; // ✅ use day index from backend
                total += value;
                return value;
              });
              return (
                <tr key={category}>
                  <td className="fw-bold">{category}</td>
                  {dailyData.map((v, i) => (
                    <td key={i}>{v > 0 ? `₹${v}` : 0}</td>
                  ))}
                  <td className="fw-bold text-success">₹{total}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={daysInMonth.length + 2}
                className="text-center text-muted py-3"
              >
                No expense records for this month.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

/* ---------------- Yearly Expense Table ---------------- */
function YearlyExpenseTable({ summary, selectedDate }) {
  const selectedYear = selectedDate.getFullYear();

  // ✅ Generate months for Jan–Dec
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
  ].map((m) => `${m} ${selectedYear.toString().slice(-2)}`);

  months.push("Total");

  // ✅ Compute Grand Total for each month and overall
  const grandTotals = {};
  months.forEach((m) => (grandTotals[m] = 0));

  Object.values(summary).forEach((categoryData) => {
    months.forEach((m) => {
      grandTotals[m] += categoryData[m] || 0;
    });
  });

  // ✅ Compute overall yearly total
  const yearlyTotal = grandTotals["Total"] || Object.values(grandTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-light p-3 rounded-4 border border-secondary overflow-auto">
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-primary">
          <tr>
            <th>Expense Category</th>
            {months.map((m) => (
              <th key={m}>{m}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Object.keys(summary).length > 0 ? (
            <>
              {/* ✅ Category-wise rows */}
              {Object.entries(summary).map(([category, data]) => (
                <tr key={category}>
                  <td className="fw-bold text-start">{category}</td>
                  {months.map((m) => (
                    <td key={m}>
                      {data[m] ? `₹${data[m].toLocaleString("en-IN")}` : 0}
                    </td>
                  ))}
                </tr>
              ))}

              {/* ✅ Grand Total Row (Sum per month + total) */}
              <tr className="table-success fw-bold">
                <td className="text-start">Grand Total</td>
                {months.map((m) => (
                  <td key={m}>
                    ₹{grandTotals[m].toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>

              {/* ✅ Yearly Total Row */}
              <tr className="table-warning fw-bold">
                <td className="text-start">Total Expenses (All Months)</td>
                <td colSpan={months.length} className="text-end">
                  ₹{yearlyTotal.toLocaleString("en-IN")}
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td
                colSpan={months.length + 1}
                className="text-center text-muted py-3"
              >
                No expense data available for {selectedYear}.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
