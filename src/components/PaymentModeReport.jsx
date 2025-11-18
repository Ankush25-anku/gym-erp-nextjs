"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Table, Spinner, Alert, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PaymentModeReport() {
  const { getToken, isLoaded } = useAuth();
  const [gymCode, setGymCode] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  /* ✅ Fetch gym code once loaded */
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
          fetchPaymentSummary(code, selectedYear);
        }
      } catch (err) {
        console.error("❌ Error fetching gym:", err);
        setAlert({ type: "danger", message: "Failed to fetch gym info." });
      }
    };
    fetchGym();
  }, [isLoaded, getToken]);

  /* ✅ Fetch payment summary data */
  const fetchPaymentSummary = async (code, year) => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${API_BASE}/api/expenses/payment-summary?gymCode=${code}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      setAlert({ type: "danger", message: "Failed to fetch payment summary." });
    } finally {
      setLoading(false);
    }
  };

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

  /* ✅ Compute grand total row */
  const grandTotals = {};
  months.forEach((m) => (grandTotals[m] = 0));
  Object.values(summary).forEach((modeData) => {
    months.forEach((m) => {
      grandTotals[m] += modeData[m] || 0;
    });
  });

  return (
    <div className="p-4 bg-white rounded-4 shadow-sm">
      <h3 className="fw-bold mb-4 text-dark">💳 Payment Mode Report</h3>

      <div className="d-flex align-items-center gap-3 mb-3">
        <Form.Label className="fw-semibold">Select Year:</Form.Label>
        <Form.Select
          style={{ width: "120px" }}
          value={selectedYear}
          onChange={(e) => {
            const year = parseInt(e.target.value);
            setSelectedYear(year);
            if (gymCode) fetchPaymentSummary(gymCode, year);
          }}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </Form.Select>
        <Button
          variant="primary"
          onClick={() => gymCode && fetchPaymentSummary(gymCode, selectedYear)}
        >
          Refresh
        </Button>
      </div>

      {alert.message && <Alert variant={alert.type}>{alert.message}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading payment mode data...</p>
        </div>
      ) : (
        <div className="bg-light p-3 rounded-4 border border-secondary overflow-auto">
          <Table bordered hover responsive className="align-middle text-center">
            <thead className="table-primary">
              <tr>
                <th>Payment Mode</th>
                {months.map((m) => (
                  <th key={m}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(summary).length > 0 ? (
                <>
                  {Object.entries(summary).map(([mode, data]) => (
                    <tr key={mode}>
                      <td className="fw-bold text-start">{mode}</td>
                      {months.map((m) => (
                        <td key={m}>
                          {data[m] ? `₹${data[m].toLocaleString("en-IN")}` : 0}
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr className="table-success fw-bold">
                    <td className="text-start">Grand Total</td>
                    {months.map((m) => (
                      <td key={m}>
                        ₹{grandTotals[m].toLocaleString("en-IN")}
                      </td>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={months.length + 1}
                    className="text-center text-muted py-3"
                  >
                    No payment data available for {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
