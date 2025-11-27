"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
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
  // 1️⃣ Save FCM Token API Call ✅
  // -----------------------------------------------------
  const saveFcmToken = async (fcmTokenValue) => {
    try {
      const token = await getToken();
      if (!token) {
        alert("Unauthorized! Please login again.");
        return;
      }

      const res = await axios.post(
        `${API}/api/clerkusers/fcm/save-fcm-token`,
        { fcmToken: fcmTokenValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ FCM Token saved:", res.data);
    } catch (err) {
      console.error(
        "❌ Error saving FCM token:",
        err.response?.data || err.message
      );
    }
  };

  // -----------------------------------------------------
  // 2️⃣ FETCH LOGGED-IN ADMIN & HIS GYM CODE ✅
  // -----------------------------------------------------
  const fetchAdminAndGym = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const gymRes = await axios.get(`${API}/api/admin/gyms/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = gymRes?.data?.gym?.gymCode;
      console.log("🏋 Gym Code:", code);

      if (!code) {
        alert("No gym found! Please create or join a gym.");
        setLoading(false);
        return;
      }

      setGymCode(code);
    } catch (err) {
      console.error("❌ Admin/Gym fetch error:", err.message);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 3️⃣ FETCH ONLY MEMBERS OF THIS GYM ✅
  // -----------------------------------------------------
  const fetchGymUsers = useCallback(
    async (code) => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const onlyMembers = res.data.filter((u) => u.role === "member");
        setUsers(onlyMembers);
      } catch (err) {
        console.error("❌ Fetch members error:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // Auto load admin + gym → then members ✅
  useEffect(() => {
    fetchAdminAndGym();
  }, [fetchAdminAndGym]);
  useEffect(() => {
    if (gymCode) fetchGymUsers(gymCode);
  }, [gymCode, fetchGymUsers]);

  // -----------------------------------------------------
  // 4️⃣ SEND NOTIFICATION ✅
  // -----------------------------------------------------
  const sendNotification = async () => {
    if (!title || !message) {
      alert("Title & message are required");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert("Unauthorized! Please login again.");
        return;
      }

      const payload = {
        userId,
        title,
        message,
        gymCode,
        data: { screen: "Notifications", audience: "member" },
      };

      const res = await axios.post(`${API}/api/notifications/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        alert(`✅ Notification sent to ${res.data.resultCount} members!`);
        setTitle("");
        setMessage("");
        setUserId("all");
      }
    } catch (err) {
      console.error("❌ Send notification failed:", err.message);
    }
  };

  // -----------------------------------------------------
  // UI ✅ (members only dropdown)
  // -----------------------------------------------------
  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-4 text-center">📣 Send Notifications</h2>

        {loading ? (
          <div className="text-center">
            <p>Loading gym members...</p>
          </div>
        ) : (
          <div
            className="card shadow p-4 mx-auto"
            style={{ maxWidth: "600px", borderRadius: 12 }}
          >
            {/* Member Select ✅ */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Select Gym Member
              </label>
              <select
                className="form-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="all">Send to ALL Gym Members ({gymCode})</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName || `${u.first_name} ${u.last_name}`} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Title ✅ */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Title</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message ✅ */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Message</label>
              <textarea
                className="form-control"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Send Button ✅ */}
            <button
              className="btn btn-primary w-100 fw-bold"
              onClick={sendNotification}
            >
              🚀 Send Notification
            </button>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
