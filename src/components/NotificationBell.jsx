// components/NotificationBell.js
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/notifications/unread-count`);
        setUnread(data.count || 0);
      } catch {}
    };

    const fetchAll = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/notifications`);
        setNotifs(data.notifications || []);
      } catch {}
    };

    fetchCount();
    fetchAll();
  }, []);

  const markRead = async (id) => {
    try {
      await axios.post(`${API_BASE}/api/notifications/mark-read/${id}`);
      setNotifs((p) => p.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnread((p) => (p > 0 ? p - 1 : 0));
    } catch {}
  };

  return (
    <div className="position-relative">
      {/* Bell Icon */}
      <Icon 
        icon="mdi:bell" 
        className="fs-3 cursor-pointer"
        style={{ cursor: "pointer" }} 
        onClick={() => setOpen(!open)}
      />

      {/* Unread Badge */}
      {unread > 0 && (
        <span
          className="badge bg-danger position-absolute"
          style={{ top: -5, right: -10, fontSize: 10, borderRadius: "50%" }}
        >
          {unread}
        </span>
      )}

      {/* Dropdown List */}
      {open && (
        <div
          className="card shadow position-absolute"
          style={{
            width: 260,
            top: 40,
            right: 0,
            zIndex: 999,
            borderRadius: 10,
          }}
        >
          <div className="card-body p-2">
            <p className="fw-bold mb-2 text-center">Notifications</p>

            {notifs.length === 0 && (
              <p className="text-muted text-center small">No notifications</p>
            )}

            {notifs.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.read) markRead(n._id);
                }}
                className="alert p-2 small mb-2"
                style={{
                  background: n.read ? "#f1f1f1" : "#e7f3ff",
                  cursor: "pointer",
                  borderRadius: 8,
                }}
              >
                <div className="fw-semibold">{n.title}</div>
                <div>{n.message}</div>
                <div className="text-end text-muted" style={{ fontSize: 9 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
