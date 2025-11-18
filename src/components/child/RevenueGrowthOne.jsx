"use client";
import useReactApexChart from "../../hook/useReactApexChart";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";

const ExpensesGrowthGraph = ({ gymId }) => {
  const { createChartTwo } = useReactApexChart();
  const [monthlyExpensesArray, setMonthlyExpensesArray] = useState(
    new Array(12).fill(0)
  );
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [currentMonthExpense, setCurrentMonthExpense] = useState(0); // ✅ added

  const { getToken, user, isLoaded } = useAuth();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (!isLoaded || !user) return;

        const token = await getToken();
        if (!token) return;

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/expenses/monthly?gymId=${gymId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = res.data.monthlyExpense || [];
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
        const expenseArray = new Array(12).fill(0);

        data.forEach((item) => {
          const index = months.indexOf(item.month);
          if (index !== -1) expenseArray[index] = item.total;
        });

        setMonthlyExpensesArray(expenseArray);
        setTotalExpenses(expenseArray.reduce((a, b) => a + b, 0));

        // ✅ set current month expense
        const now = new Date();
        const currentMonth = now.toLocaleString("default", { month: "short" });
        const current = data.find((item) => item.month === currentMonth);
        setCurrentMonthExpense(current?.total || 0);
      } catch (err) {
        console.error(
          "❌ Failed to fetch monthly expenses",
          err.response?.data || err.message
        );
      }
    };

    if (gymId) fetchExpenses();
  }, [gymId, getToken, isLoaded, user]);

  return (
    <div className="col-xxl-4">
      <div className="card h-100 radius-8 border">
        <div className="card-body p-24">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <div>
              <h6 className="mb-2 fw-bold text-lg">Monthly Expenses</h6>
              <span className="text-sm fw-medium text-secondary-light">
                Expense Report
              </span>
            </div>
            <div className="text-end">
              <h6 className="mb-2 fw-bold text-lg">
                ₹{currentMonthExpense.toLocaleString("en-IN")}
              </h6>
            </div>
          </div>

          <div id="expenses-chart" className="mt-28">
            {createChartTwo("#ff4d4f", 162, monthlyExpensesArray)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesGrowthGraph;
