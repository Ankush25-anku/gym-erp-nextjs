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
  const [message, setMessage] = useState(""); // ✅ used in payload

  // -----------------------------------------------------
  // 1️⃣ Load Clerk SUB + GymCode from storage ✅
  // -----------------------------------------------------
  useEffect(() => {
    const loadStorage = async () => {
      const sub = localStorage.getItem("clerkSub"); // ✅ saved from RN or login
      const code = localStorage.getItem("gymCode");

      console.log("🧠 Storage loaded:", { sub, gymCode: code });

      if (sub) setUserId(sub); // optional for sending single user
      if (code) setGymCode(code);
    };

    loadStorage();
  }, []);

  // -----------------------------------------------------
  // 2️⃣ Fetch Logged-in Admin Gym Code ✅ (Correct route)
  // -----------------------------------------------------
  const fetchAdminGym = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // ✅ fixed gym fetch route
      const res = await axios.get(`${API}/api/admin/gyms/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const code = res?.data?.gym?.gymCode;
      console.log("🏋 Gym Code from backend:", code);

      if (!code) {
        alert("No Gym Found! Please create or join a gym.");
        setLoading(false);
        return;
      }

      setGymCode(code);
    } catch (err) {
      console.error(
        "❌ Admin/Gym fetch failed:",
        err.response?.data || err.message
      );
      alert("Failed to load gym info.");
      setLoading(false);
    }
  }, [getToken]);

  // -----------------------------------------------------
  // 3️⃣ Fetch Only Gym Members ✅ (role === member)
  // -----------------------------------------------------
  const fetchGymMembers = useCallback(
    async (code) => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await axios.get(`${API}/api/clerkusers/by-gym/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const onlyMembers = res.data.filter((u) => u.role === "member"); // ✅ correct filter
        console.log("✅ Gym Members:", onlyMembers);

        setUsers(onlyMembers);
      } catch (err) {
        console.error(
          "❌ Member fetch error:",
          err.response?.data || err.message
        );
        alert("Failed to load members.");
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // -----------------------------------------------------
  // 4️⃣ Save FCM token to backend ✅ (Correct body key)
  // -----------------------------------------------------
  const saveFcmToken = async (fcmTokenValue) => {
    if (!fcmTokenValue) return;

    try {
      const clerkToken = await getToken();
      if (!clerkToken) return;

      const res = await axios.post(
        `${API}/api/clerkusers/fcm/save-fcm-token`, // ✅ positively mounted
        {
          fcmToken: fcmTokenValue, // 👈 FIXED ✅ must match backend key
          platform: NATIVE_PLATFORM,
          gymCode,
        },
        {
          headers: { Authorization: `Bearer ${clerkToken}` },
        }
      );

      console.log("📲 FCM Token stored in DB ✅:", res.data);
    } catch (err) {
      console.error("❌ FCM save failed:", err.response?.data || err.message);
    }
  };

  // -----------------------------------------------------
  // 5️⃣ Send Notification ✅ (Correct payload)
  // -----------------------------------------------------
  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Title & message are required");
      return;
    }

    try {
      const clerkToken = await getToken();
      if (!clerkToken) {
        alert("Unauthorized! Login again.");
        return;
      }

      const payload = {
        audience: "member",
        title,
        body: message, // ✅ backend expects `body` field for push
        gymCode,
        userId, // "all" or specific _id
        data: { screen: "Notifications" },
      };

      console.log("🚀 Sending notification payload:", payload);

      const res = await axios.post(`${API}/api/notifications/send`, payload, {
        headers: { Authorization: `Bearer ${clerkToken}` },
      });

      if (res.data.success) {
        alert(`✅ Notification sent to ${res.data.resultCount} members!`);
        setTitle("");
        setMessage("");
        setUserId("all");
      }
    } catch (err) {
      console.error(
        "❌ Notification send failed:",
        err.response?.data || err.message
      );
      alert("Failed to send notification.");
    }
  };

  // -----------------------------------------------------
  // 6️⃣ Run API effects chain ✅
  // -----------------------------------------------------
  useEffect(() => {
    fetchAdminGym();
  }, [fetchAdminGym]);

  useEffect(() => {
    if (gymCode) fetchGymMembers(gymCode);
  }, [gymCode, fetchGymMembers]);

  // -----------------------------------------------------
  // UI (Only gym members dropdown) ✅
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
