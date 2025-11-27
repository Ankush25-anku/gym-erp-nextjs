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
  // 1️⃣ FETCH ADMIN INFO + GET HIS GYM CODE (GymApproval)
  // -----------------------------------------------------
  const fetchAdminAndGym = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch logged in Clerk profile
      await axios.get(`${API}/api/clerkusers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch gymCode from GymApprovalRoutes
      const gymRes = await axios.get(`${API}/api/gym/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = gymRes?.data?.gym?.gymCode;

      if (!code) {
        alert("No gym found! Please join or create a gym first.");
        return;
      }

      setGymCode(code);
    } catch (err) {
      console.error("Error fetching admin or gym info:", err);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 2️⃣ FETCH ALL CLERK USERS THAT BELONG TO THIS GYM
  // -----------------------------------------------------
  const fetchGymUsers = useCallback(
    async (code) => {
      try {
        const token = await getToken();

        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // -----------------------------------------------------
  // 3️⃣ Load admin + gym → then load users
  // -----------------------------------------------------
  useEffect(() => {
    fetchAdminAndGym();
  }, []);

  useEffect(() => {
    if (gymCode) {
      fetchGymUsers(gymCode);
    }
  }, [gymCode, fetchGymUsers]);

  // -----------------------------------------------------
  // 4️⃣ SEND NOTIFICATION TO USER OR ALL USERS
  // -----------------------------------------------------
  const sendNotification = async () => {
    if (!title || !message) {
      alert("Title & message are required");
      return;
    }

    try {
      const token = await getToken();

      await axios.post(
        `${API}/api/notifications/send`,
        { userId, title, message },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Notification Sent Successfully!");
      setTitle("");
      setMessage("");
      setUserId("all");
    } catch (err) {
      console.error("Error sending notification:", err);
      alert("Failed to send notification");
    }
  };

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="fw-bold mb-4">Send Notifications</h2>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div
            className="card shadow-sm p-4"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              borderRadius: "12px",
            }}
          >
            {/* Select User */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Select Member</label>
              <select
                className="form-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="all">
                  Send to ALL Members of Gym ({gymCode})
                </option>

                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
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

            {/* Message */}
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

            {/* Submit */}
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
