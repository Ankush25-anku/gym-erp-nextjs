"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import dynamic from "next/dynamic";
import useReactApexChart from "../../hook/useReactApexChart";
import MasterLayout from "../../masterLayout/MasterLayout";
import { useUser, useAuth } from "@clerk/nextjs";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const SUPERADMIN_API = {
  MEMBERS: `${API_BASE}/api/superadmin/members`,
  TRAINERS: `${API_BASE}/api/superadmin/trainers`,
  STAFF: `${API_BASE}/api/superadmin/staff`,
  EXPENSES: `${API_BASE}/api/superadmin/expenses/total`,
  ATTENDANCE: `${API_BASE}/api/superadmin/attendance`,
};

const SuperAdminDashboard = () => {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [memberCheckins, setMemberCheckins] = useState(0);
  const [staffTrainerCheckins, setStaffTrainerCheckins] = useState(0);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [revenueOnlyOptions, setRevenueOnlyOptions] = useState(null);
  const [revenueOnlySeries, setRevenueOnlySeries] = useState([]);
  const [barChartSeriesTwo, setBarChartSeriesTwo] = useState([]);
  const [barChartOptionsTwo, setBarChartOptionsTwo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const { signOut, getToken } = useAuth();
  const { user } = useUser();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token found");
      const res = await fetch(`${API_BASE}/api/clerkusers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      const profileWithRole = {
        ...data,
        role: data.publicMetadata?.role || "member",
      };
      setProfile(profileWithRole);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    if (isSidebarOpen) fetchProfile();
  }, [isSidebarOpen]);

  useEffect(() => {
    // Automatically fetch all gyms' data
    fetchAllStats();
    // fetchMonthlyRevenueExpenses();
  }, []);

  // const fetchMonthlyRevenueExpenses = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const endpoint = `${API_BASE}/api/members/revenue/breakdown?gymId=all`;
  //     const res = await axios.get(endpoint, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const revenueData = res.data.monthlyRevenue || [];
  //     const expenseData = res.data.monthlyExpense || [];

  //     const allMonths = [
  //       "Jan",
  //       "Feb",
  //       "Mar",
  //       "Apr",
  //       "May",
  //       "Jun",
  //       "Jul",
  //       "Aug",
  //       "Sep",
  //       "Oct",
  //       "Nov",
  //       "Dec",
  //     ];

  //     const revenueMap = Object.fromEntries(
  //       revenueData.map((r) => [r.month, r.total])
  //     );
  //     const expenseMap = Object.fromEntries(
  //       expenseData.map((e) => [e.month, e.total])
  //     );

  //     const revenueSeries = allMonths.map((m) => revenueMap[m] || 0);
  //     const expenseSeries = allMonths.map((m) => expenseMap[m] || 0);

  //     setBarChartSeriesTwo([
  //       { name: "Revenue", data: revenueSeries },
  //       { name: "Expenses", data: expenseSeries },
  //     ]);

  //     setBarChartOptionsTwo({
  //       chart: { type: "bar", height: 310, toolbar: { show: false } },
  //       plotOptions: {
  //         bar: { borderRadius: 4, columnWidth: "45%", endingShape: "rounded" },
  //       },
  //       dataLabels: { enabled: false },
  //       colors: ["#00C897", "#FF4C4C"],
  //       xaxis: { categories: allMonths },
  //       tooltip: { y: { formatter: (val) => `₹${Math.round(val)}` } },
  //       legend: { position: "top", horizontalAlign: "center" },
  //     });

  //     setRevenueOnlySeries([{ name: "Revenue", data: revenueSeries }]);
  //     setRevenueOnlyOptions({
  //       chart: { type: "line", height: 310, toolbar: { show: false } },
  //       stroke: { curve: "smooth", width: 3 },
  //       colors: ["#4E82F4"],
  //       xaxis: { categories: allMonths },
  //     });

  //     const now = new Date();
  //     const currentMonth = now.toLocaleString("en-US", { month: "short" });
  //     const current = revenueData.find((item) => item.month === currentMonth);
  //     setCurrentMonthRevenue(current?.total || 0);
  //   } catch (err) {
  //     console.error("📉 Revenue fetch failed:", err);
  //   }
  // };

  const fetchAllStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const today = new Date().toISOString().split("T")[0];

      const [memberRes, trainerRes, staffRes, expenseRes, attendanceRes] =
        await Promise.all([
          axios.get(SUPERADMIN_API.MEMBERS, { headers }),
          axios.get(SUPERADMIN_API.TRAINERS, { headers }),
          axios.get(SUPERADMIN_API.STAFF, { headers }),
          axios.get(SUPERADMIN_API.EXPENSES, { headers }),
          axios.get(`${SUPERADMIN_API.ATTENDANCE}?date=${today}`, { headers }),
        ]);

      const membersData = memberRes.data || [];
      const trainersData = trainerRes.data || [];
      const staffData = staffRes.data || [];
      const expenseTotal = Number(expenseRes.data?.total || 0);
      const attendanceData = attendanceRes.data || [];

      setMembers(membersData);
      setTrainers(trainersData);
      setStaff(staffData);
      setTotalExpenses(expenseTotal);

      let revenue = 0;
      membersData.forEach((member) => {
        const plan = member?.plan?.toLowerCase?.();
        if (plan?.includes("basic")) revenue += 1000;
        else if (plan?.includes("premium")) revenue += 6000;
        else if (plan?.includes("vip")) revenue += 12000;
      });
      setTotalRevenue(revenue);

      const memberCheckins = attendanceData.filter(
        (e) => e.status === "Check-in" && e.category?.toLowerCase() === "member"
      ).length;

      const staffTrainerCheckins = attendanceData.filter(
        (e) =>
          e.status === "Check-in" &&
          ["staff", "trainer"].includes(e.category?.toLowerCase())
      ).length;

      setMemberCheckins(memberCheckins);
      setStaffTrainerCheckins(staffTrainerCheckins);
    } catch (error) {
      console.error("🔍 Failed to fetch stats:", error);
    }
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold mb-4">Super Admin Dashboard</h2>

        {/* 📊 Stats Section */}
        <div className="row gy-4">
          <StatCard
            icon="mingcute:user-follow-fill"
            color="bg-gradient-end-1"
            circleColor="#487fff"
            title="Total Members"
            value={members.length}
            chartColor="#487fff"
            trend="+120 this month"
          />
          <StatCard
            icon="mdi:account-tie"
            color="bg-gradient-end-2"
            circleColor="#45b369"
            title="Total Trainers"
            value={trainers.length}
            chartColor="#45b369"
            trend="+15 joined"
          />
          <StatCard
            icon="mdi:currency-usd"
            color="bg-gradient-end-3"
            circleColor="#f4941e"
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString("en-IN")}`}
            chartColor="#f4941e"
            trend="+₹50k this week"
          />
          <StatCard
            icon="mdi:chart-line"
            color="bg-gradient-end-4"
            circleColor="#8252e9"
            title="Total Staff"
            value={staff.length}
            chartColor="#8252e9"
            trend="+5 new hires"
          />
          <StatCard
            icon="mdi:cash-minus"
            color="bg-gradient-end-5"
            circleColor="#de3ace"
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString("en-IN")}`}
            chartColor="#de3ace"
            trend="-₹10k this week"
          />
          <StatCard
            icon="mdi:account-check"
            color="bg-gradient-end-6"
            circleColor="#00b8f2"
            title="Members Checked-in Today"
            value={memberCheckins}
            chartColor="#00b8f2"
            trend="+12 today"
          />
          <StatCard
            icon="mdi:account-group"
            color="bg-gradient-end-2"
            circleColor="#2E7D32"
            title="Staff & Trainers Checked-in"
            value={staffTrainerCheckins}
            chartColor="#2E7D32"
            trend="+8 today"
          />
        </div>

        {/* 📈 Charts Section */}
        <div className="card border-0 shadow-sm mt-5">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1">Earning Statistics</h5>
                <small className="text-muted">
                  Revenue vs Expenses (Monthly)
                </small>
              </div>
              <div className="text-end">
                <h6 className="mb-1 fw-bold">₹{currentMonthRevenue}</h6>
                <span className="badge bg-success-subtle text-success">
                  +{Math.round(currentMonthRevenue * 0.2)} est.
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">Revenue Growth</h5>
                    {revenueOnlyOptions && revenueOnlySeries.length > 0 ? (
                      <ReactApexChart
                        options={revenueOnlyOptions}
                        series={revenueOnlySeries}
                        type="line"
                        height={310}
                      />
                    ) : (
                      <p className="text-muted text-center">Loading chart...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">Earning Statistic</h5>
                    {barChartOptionsTwo && barChartSeriesTwo.length > 0 ? (
                      <ReactApexChart
                        options={barChartOptionsTwo}
                        series={barChartSeriesTwo}
                        type="bar"
                        height={310}
                      />
                    ) : (
                      <p className="text-muted text-center">Loading chart...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
};

const StatCard = ({
  icon,
  color,
  circleColor,
  title,
  value,
  chartColor,
  trend,
}) => {
  const { createChart } = useReactApexChart();

  return (
    <div className="col-xxl-4 col-sm-6">
      <div className={`card p-3 shadow-2 radius-8 border h-100 ${color}`}>
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex align-items-center gap-3">
              <span
                className="mb-0 w-48-px h-48-px flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6"
                style={{ backgroundColor: circleColor }}
              >
                <Icon icon={icon} className="icon" />
              </span>
              <div>
                <span className="fw-medium text-secondary-light text-sm">
                  {title}
                </span>
                <h6 className="fw-semibold">{value}</h6>
              </div>
            </div>
            <div>{createChart(chartColor)}</div>
          </div>
          <p className="text-sm mb-0">
            Change:{" "}
            <span className="bg-success-focus px-1 rounded-2 fw-medium text-success-main text-sm">
              {trend}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
