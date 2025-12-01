"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import MasterLayout from "../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function NotificationsPage() {
  const { getToken } = useAuth();

  const [gym, setGym] = useState(null);
  const [gymCode, setGymCode] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [receiverId, setReceiverId] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // 1️⃣ Fetch only approved members for this gymCode
  const fetchMembers = useCallback(async (code, token) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/clerkusers/members-only/${code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("👥 Members:", res.data.members);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("❌ Failed to fetch members:", err.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2️⃣ Fetch gym and then members
  const fetchGym = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const gymRes = await axios.get(`${API_BASE}/api/gym/my-gym`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!gymRes.data.success || !gymRes.data.gym) {
        alert("⚠️ No gym found, please create/join one first!");
        setLoading(false);
        return;
      }

      const code = gymRes.data.gym.gymCode;

      setGym(gymRes.data.gym);
      setGymCode(code);

      // ✅ fetch only members of that gym who are approved
      const membersRes = await axios.get(
        `${API_BASE}/api/clerkusers/by-gym/${code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ filter only Clerk role member
      const onlyMembers = membersRes.data.filter((u) => u.role === "member");
      setMembers(onlyMembers);
    } catch (err) {
      console.error("❌ Gym fetch failed:", err.message);
      alert("❌ Failed to fetch gym");
      setMembers([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchGym();
  }, [fetchGym]);

  // 3️⃣ Send notification
  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert("⚠️ Title & message are required!");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const payload = {
        userId: receiverId,
        title,
        message,
        gymCode: gym?.gymCode,
        data: { screen: "WorkoutPlan", memberId: "12345" },
      };

      const sendRes = await axios.post(
        `${API_BASE}/api/notifications/send`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (sendRes.data.success) {
        alert(
          `✅ Notification sent to ${sendRes.data.sentTokensCount} device(s)!`
        );
        setTitle("");
        setMessage("");
        setReceiverId("all");
      } else {
        alert("⚠️ " + sendRes.data.message);
      }
    } catch (err) {
      console.error("❌ Notification send error:", err.message);
      alert("❌ Failed to send notification");
    }
  };

  return (
    <MasterLayout>
      <div className="container py-4">
        <h2 className="text-center fw-bold mb-4">Send Notifications</h2>

        {gym && (
          <div className="alert alert-info text-center">
            <strong>Gym:</strong> {gym.gymName} ({gym.gymCode})
          </div>
        )}

        {loading ? (
          <p className="text-center">Loading members...</p>
        ) : (
          <div
            className="card shadow-sm p-4"
            style={{ maxWidth: 600, margin: "0 auto", borderRadius: 12 }}
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">Select Member</label>
              <select
                className="form-select"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
              >
                <option value="all">🔔 Send to ALL Approved Members</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName} ({m.email})
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
                placeholder="Enter title"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Message</label>
              <textarea
                className="form-control"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message"
              />
            </div>

            <button
              className="btn btn-primary w-100"
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
