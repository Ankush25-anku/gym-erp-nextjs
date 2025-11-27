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

  const [receiverId, setReceiverId] = useState("all"); // 🔥 renamed for clarity
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // -----------------------------------------------------
  // 1️⃣ FETCH ADMIN & GYM CODE
  // -----------------------------------------------------
  const fetchAdminAndGym = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch profile just to verify token
      await axios.get(`${API}/api/clerkusers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch gymCode
      const gymRes = await axios.get(`${API}/api/admin/gyms/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = gymRes?.data?.gym?.gymCode || gymRes?.data?.gym?.gymCode;
      if (!code) {
        alert("⚠️ No gym found! Please join or create a gym first.");
        setLoading(false);
        return;
      }

      setGymCode(code);
    } catch (err) {
      console.error("❌ Error fetching admin or gym:", err.message);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 2️⃣ FETCH ALL USERS OF THIS GYM
  // -----------------------------------------------------
  const fetchGymUsers = useCallback(
    async (code) => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching users by gym:", err.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // Load admin + gym
  useEffect(() => {
    fetchAdminAndGym();
  }, [fetchAdminAndGym]);

  // Load users when gymCode arrives
  useEffect(() => {
    if (gymCode) {
      fetchGymUsers(gymCode);
    }
  }, [gymCode, fetchGymUsers]);

  // -----------------------------------------------------
  // 3️⃣ SEND NOTIFICATION
  // -----------------------------------------------------
  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert("⚠️ Title & message are required!");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      await axios.post(
        `${API}/api/notifications/send`,
        { userId: receiverId, title, message, gymCode }, // 🔥 added gymCode
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Notification sent successfully!");

      // Reset form ✅
      setTitle("");
      setMessage("");
      setReceiverId("all");
    } catch (err) {
      console.error("❌ Notification send failed:", err.message);
      alert("❌ Failed to send notification");
    }
  };

  // -----------------------------------------------------
  // UI RENDER
  // -----------------------------------------------------
  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-4">Send Notifications</h2>

        {loading ? (
          <p className="text-center">Loading gym users...</p>
        ) : (
          <div
            className="card shadow-sm p-4"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              borderRadius: "12px",
            }}
          >
            {/* SELECT RECEIVER */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Select Member</label>
              <select
                className="form-select"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
              >
                <option value="all">
                  Send to ALL Members of Gym ({gymCode || "—"})
                </option>

                {users.length > 0 ? (
                  users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName || "No Name"} ({u.email || "No Email"})
                    </option>
                  ))
                ) : (
                  <option disabled>No users registered in this gym</option>
                )}
              </select>
            </div>

            {/* TITLE */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Title</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
              />
            </div>

            {/* MESSAGE */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Message</label>
              <textarea
                className="form-control"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
              ></textarea>
            </div>

            {/* SEND */}
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
