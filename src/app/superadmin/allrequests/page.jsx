"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import MasterLayout from "../../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AllRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const userRole = user?.publicMetadata?.role?.toLowerCase();

  // 🔹 Fetch all requests (admin → staff, superadmin → admin)
  const fetchRequests = async (showLoading = true) => {
    if (!isLoaded || !isSignedIn || !user) return;

    const currentEmail = user.primaryEmailAddress?.emailAddress;
    if (!currentEmail) return;

    const gymKey = `joinedGymCode_${userRole}_${currentEmail}`;
    const joinedGymCode = (localStorage.getItem(gymKey) || "").toUpperCase();
    if (!joinedGymCode) return;

    try {
      if (showLoading) setLoading(true);
      const token = await getToken();

      console.log("📩 Fetching join requests...");
      console.log("👤 User role:", userRole);
      console.log("🏋️ Gym code:", joinedGymCode);

      // Choose endpoint dynamically (superadmin vs admin)
      const endpoint =
        userRole === "superadmin"
          ? `${API_BASE}/api/gym/requests/admin/all`
          : `${API_BASE}/api/gym/requests/staff/all`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: { gymCode: joinedGymCode },
      });

      const data = Array.isArray(res.data) ? res.data : [];

      // Remove duplicates based on gymCode + requesterEmail
      const uniqueRequests = Object.values(
        data.reduce((acc, item) => {
          const key = `${item.gymCode}-${item.requesterEmail}`;
          if (!acc[key]) acc[key] = item;
          return acc;
        }, {})
      );

      // Filter by role dynamically
      const filtered = uniqueRequests.filter(
        (r) =>
          r.clerkRole?.toLowerCase() ===
            (userRole === "superadmin" ? "admin" : "staff") &&
          r.gymCode?.toUpperCase() === joinedGymCode
      );

      console.log(`✅ Fetched ${filtered.length} unique ${userRole} requests.`);
      setRequests(filtered);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setRequests([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(true);
  }, [isLoaded, isSignedIn, user]);

  // 🔹 Approve request
  const handleApprove = async (id) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE}/api/gym/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests((prev) =>
        prev.map((r) =>
          r._id === id
            ? {
                ...r,
                status: "approved",
                approvedBy: user?.firstName || "SuperAdmin",
              }
            : r
        )
      );
    } catch (err) {
      console.error("❌ Error approving request:", err);
    }
  };

  // 🔹 Reject request
  const handleReject = async (id) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE}/api/gym/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests((prev) =>
        prev.map((r) =>
          r._id === id
            ? {
                ...r,
                status: "rejected",
                rejectedBy: user?.firstName || "SuperAdmin",
              }
            : r
        )
      );
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
    }
  };

  // 🔹 Restrict access
  if (isLoaded && user && !["superadmin", "admin"].includes(userRole)) {
    return (
      <MasterLayout>
        <div className="container mt-5 text-center">
          <h5 className="text-danger">Access Denied</h5>
          <p>Only SuperAdmins or Admins can view join requests.</p>
        </div>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>
            📋{" "}
            {userRole === "superadmin"
              ? "All Admin Join Requests"
              : "All Staff Join Requests"}
          </h4>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => fetchRequests(true)}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-muted">No join requests found.</p>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="card p-3 mb-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>{req.fullName || "N/A"}</h6>
                  <p className="mb-1 text-muted">{req.requesterEmail}</p>
                </div>
                <span
                  className={`badge px-3 py-2 rounded-pill ${
                    req.status === "approved"
                      ? "bg-success"
                      : req.status === "pending"
                      ? "bg-warning text-dark"
                      : "bg-danger"
                  }`}
                >
                  {req.status.toUpperCase()}
                </span>
              </div>

              <hr />
              <p>
                <strong>Gym Code:</strong> {req.gymCode}
              </p>
              <p>
                <strong>Clerk Role:</strong> {req.clerkRole || req.role}
              </p>
              <p>
                <strong>Requested At:</strong>{" "}
                {req.requestedAt
                  ? new Date(req.requestedAt).toLocaleString()
                  : "N/A"}
              </p>

              <div className="d-flex gap-2 mt-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleApprove(req._id)}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleReject(req._id)}
                >
                  ❌ Reject
                </button>
              </div>

              {req.status === "approved" && (
                <p className="mt-2 text-success small">
                  Approved by: {req.approvedBy || "SuperAdmin"}
                </p>
              )}
              {req.status === "rejected" && (
                <p className="mt-2 text-danger small">
                  Rejected by: {req.rejectedBy || "SuperAdmin"}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </MasterLayout>
  );
}
