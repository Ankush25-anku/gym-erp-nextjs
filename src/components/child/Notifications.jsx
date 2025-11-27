"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import MasterLayout from "../../masterLayout/MasterLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function NotificationsPage() {
  const { getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [gymCode, setGymCode] = useState("");
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // -----------------------------------------------------
  // 1️⃣ Print token manually so you can copy it ✅
  // -----------------------------------------------------
  const logClerkToken = async () => {
    const token = await getToken();
    console.log("🎫 Clerk Session JWT Token:", token);
  };

  // -----------------------------------------------------
  // 2️⃣ Fetch My Gym ✅
  // -----------------------------------------------------
  const fetchAdminGym = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      console.log("🚫 No Clerk token available");
      setLoading(false);
      return;
    }
    console.log("🎫 Using Clerk token for Gym fetch:", token);

    try {
      const res = await axios.get(`${API}/api/admin/gyms/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = res?.data?.gym?.gymCode || "";
      if (!code) {
        alert("No Gym Found!");
        setLoading(false);
        return;
      }

      console.log("🏋 My Gym Code:", code);
      setGymCode(code);
      localStorage.setItem("gymCode", code);
    } catch (err) {
      console.error("❌ Gym fetch:", err.response?.data || err.message);
      setLoading(false);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 3️⃣ Fetch Gym Members ✅
  // -----------------------------------------------------
  const fetchGymMembers = useCallback(
    async (code) => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const onlyMembers = res.data.filter((u) => u.role === "member");
        setUsers(onlyMembers);
      } catch (err) {
        console.error("❌ Member fetch:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // -----------------------------------------------------
  // 4️⃣ Send Notification ✅
  // -----------------------------------------------------
  const sendNotification = async () => {
    const token = await getToken();
    console.log("🎫 Clerk Session Token Used for Send:", token);

    if (!token) {
      alert("Unauthorized");
      return;
    }

    try {
      const payload = {
        userId,
        audience: "member",
        title,
        body: message,
        gymCode,
        data: { screen: "Notifications" },
      };

      const res = await axios.post(`${API}/api/notifications/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Notification API Response:", res.data);
    } catch (err) {
      console.error("❌ Send Notification:", err.response?.data || err.message);
    }
  };

  // Load chain ✅
  useEffect(() => {
    fetchAdminGym();
  }, [fetchAdminGym]);

  useEffect(() => {
    if (gymCode) fetchGymMembers(gymCode);
  }, [gymCode]);

  // UI ✅
  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-3 text-center">📣 Send Notifications</h2>

        {/* 👇 New Button to Print Token */}
        <button
          className="btn btn-dark w-100 fw-bold mb-3"
          onClick={logClerkToken}
        >
          🧪 Print Clerk Token to Console
        </button>

        <div
          className="card shadow p-4 mx-auto"
          style={{ maxWidth: 600, borderRadius: 12 }}
        >
          <div className="mb-3">
            <label className="form-label fw-semibold">Select Gym Member</label>
            <select
              className="form-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="all">Send to ALL Gym Members ({gymCode})</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Message</label>
            <textarea
              className="form-control"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary w-100 fw-bold"
            onClick={sendNotification}
          >
            🚀 Send Notification
          </button>
        </div>
      </div>
    </MasterLayout>
  );
}
