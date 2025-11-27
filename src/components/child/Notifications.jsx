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
  // 1️⃣ Fetch My Gym Code ✅
  // -----------------------------------------------------
  const fetchAdminGym = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API}/api/admin/gyms/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = res?.data?.gym?.gymCode || "";
      if (!code) {
        alert("No Gym Found! Please create or join a gym.");
        setLoading(false);
        return;
      }

      console.log("🏋 My Gym Code:", code);
      setGymCode(code);
      localStorage.setItem("gymCode", code);
    } catch (err) {
      console.error("❌ Gym fetch:", err.response?.data || err.message);
      alert("Failed to load gym.");
      setLoading(false);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 2️⃣ Fetch Gym Members Only ✅
  // -----------------------------------------------------
  const fetchGymMembers = useCallback(
    async (code) => {
      const token = await getToken();
      if (!token || !code) return;

      try {
        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const onlyMembers = res.data.filter((u) => u.role === "member");
        console.log("👥 Members:", onlyMembers);
        setUsers(onlyMembers);
      } catch (err) {
        console.error("❌ Member fetch:", err.response?.data || err.message);
        alert("Failed to load members.");
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // -----------------------------------------------------
  // 3️⃣ Save FCM Token to Backend ✅
  // -----------------------------------------------------
  const saveFcmToken = async (fcmTokenValue) => {
    if (!fcmTokenValue || !gymCode) return;

    const token = await getToken();
    if (!token) return;

    try {
      const res = await axios.post(
        `${API}/api/clerkusers/fcm/save-fcm-token`,
        {
          fcmToken: fcmTokenValue, // ✅ Correct key
          platform: NATIVE_PLATFORM,
          gymCode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ FCM Token Save:", res.data);
    } catch (err) {
      console.error("❌ FCM Save:", err.response?.data || err.message);
      alert("Failed to save FCM token.");
    }
  };

  // -----------------------------------------------------
  // 4️⃣ Send Notification ✅
  // -----------------------------------------------------
  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Title & message are required");
      return;
    }

    const token = await getToken();
    if (!token) {
      alert("Unauthorized!");
      return;
    }

    try {
      const payload = {
        userId,
        audience: "member",
        title,
        body: message, // ✅ backend FCM body expects "body"
        gymCode,
        data: { screen: "Notifications" },
      };

      console.log("🚀 Sending:", payload);

      const res = await axios.post(`${API}/api/notifications/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        alert(`✅ Sent to ${res.data.resultCount} members`);
        setTitle("");
        setMessage("");
        setUserId("all");
      }
    } catch (err) {
      console.error("❌ Send:", err.response?.data || err.message);
      alert("Failed to send notification.");
    }
  };

  // -----------------------------------------------------
  // 5️⃣ Load chain on start ✅
  // -----------------------------------------------------
  useEffect(() => {
    fetchAdminGym();
  }, [fetchAdminGym]);

  useEffect(() => {
    if (gymCode) fetchGymMembers(gymCode);
  }, [gymCode, fetchGymMembers]);

  // -----------------------------------------------------
  // UI ✅
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
            style={{ maxWidth: 600, borderRadius: 12 }}
          >
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
        )}
      </div>
    </MasterLayout>
  );
}
