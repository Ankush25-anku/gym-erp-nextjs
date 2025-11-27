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
  // 1️⃣ FETCH LOGGED-IN ADMIN & HIS GYM CODE ✅
  // -----------------------------------------------------
  const fetchAdminAndGym = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      await axios.get(`${API}/api/clerkusers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gymRes = await axios.get(`${API}/api/gym/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = gymRes?.data?.gym?.gymCode;
      console.log("🏋 Gym Code from backend:", code);

      if (!code) {
        alert("No gym found! Please create or join a gym.");
        setLoading(false);
        return;
      }

      setGymCode(code);
    } catch (err) {
      console.error("Error fetching admin or gym:", err.message);
      alert("Failed to load admin/gym info");
      setLoading(false);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 2️⃣ FETCH ONLY MEMBERS OF THIS GYM ✅
  // -----------------------------------------------------
  const fetchGymUsers = useCallback(
    async (code) => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📥 All users from gym API:", res.data);

        // ✅ Filter only members
        const onlyMembers = res.data.filter((u) => u.role === "member");
        console.log("✅ Only gym members:", onlyMembers);

        setUsers(onlyMembers);
      } catch (err) {
        console.error("Error fetching gym members:", err.message);
        alert("Failed to load gym members");
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // -----------------------------------------------------
  // 3️⃣ Load admin + gym → then load members ✅
  // -----------------------------------------------------
  useEffect(() => {
    fetchAdminAndGym();
  }, [fetchAdminAndGym]);

  useEffect(() => {
    if (gymCode) {
      fetchGymUsers(gymCode);
    }
  }, [gymCode, fetchGymUsers]);

  // -----------------------------------------------------
  // 4️⃣ SEND NOTIFICATION ✅ (Now sends gymCode to backend)
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
        gymCode, // 👈 REQUIRED ✅
        data: { screen: "Notifications", audience: "member" },
      };

      console.log("🚀 Sending notification payload:", payload);

      const res = await axios.post(`${API}/api/notifications/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📤 Notification response:", res.data);

      if (res.data.success) {
        alert(`✅ Notification sent to ${res.data.resultCount} members!`);
        setTitle("");
        setMessage("");
        setUserId("all");
      } else {
        alert(`❌ ${res.data.message}`);
      }
    } catch (err) {
      console.error(
        "❌ Notification send failed:",
        err.response?.data || err.message
      );
      alert("Failed to send notification");
    }
  };

  // -----------------------------------------------------
  // UI (Dropdown now shows only members) ✅
  // -----------------------------------------------------
  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-4">Send Notifications</h2>

        {loading ? (
          <p>Loading members...</p>
        ) : (
          <div
            className="card shadow-sm p-4"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              borderRadius: "12px",
            }}
          >
            {/* Select Member ✅ */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Select Gym Member Only
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
              ></textarea>
            </div>

            {/* Send Button ✅ */}
            <button
              className="btn btn-primary w-100"
              onClick={sendNotification}
            >
              Send Notification
            </button>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
