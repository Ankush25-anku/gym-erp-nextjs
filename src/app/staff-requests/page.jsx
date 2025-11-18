"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import MasterLayout from "../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StaffRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const userRole = user?.publicMetadata?.role?.toLowerCase();

  // ✅ Fetch only STAFF join requests for the current admin's gym
  const fetchRequests = async (showLoading = true) => {
    if (!isLoaded || !isSignedIn || !user) return;

    const currentEmail = user.primaryEmailAddress?.emailAddress;
    if (!currentEmail) return;

    const gymKey = `joinedGymCode_${userRole}_${currentEmail}`;
    const joinedGymCode = (localStorage.getItem(gymKey) || "").toUpperCase();

    if (!joinedGymCode) {
      console.warn("⚠️ No joined gym code found in localStorage");
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const token = await getToken();

      console.log("📩 Fetching STAFF requests for gym:", joinedGymCode);

      // ✅ Include both gymCode AND type for backend
      const res = await axios.get(`${API_BASE}/api/gym/requests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          gymCode: joinedGymCode,
          type: "staff", // 👈 Important — backend expects this
        },
      });

      console.log("✅ All requests fetched:", res.data);

      // ✅ Filter only STAFF requests belonging to this gym
      const staffRequests = (res.data || []).filter(
        (req) =>
          req.role?.toLowerCase() === "staff" &&
          req.gymCode?.toUpperCase() === joinedGymCode
      );

      console.log(`✅ Found ${staffRequests.length} staff requests`);
      setRequests(staffRequests);
    } catch (err) {
      console.error(
        "❌ Error fetching staff requests:",
        err.response?.data || err.message
      );
      setRequests([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(true);
  }, [isLoaded, isSignedIn, user]);

  // ✅ Approve or Reject staff join request
  const handleStatusUpdate = async (id, action) => {
    const confirmMsg =
      action === "approve"
        ? "Approve this staff request?"
        : "Reject this staff request?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE}/api/gym/${action}/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update status instantly in UI
      setRequests((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: action === "approve" ? "approved" : "rejected" }
            : r
        )
      );
    } catch (err) {
      console.error(`❌ Error performing ${action} on request:`, err);
    }
  };

  // ✅ Restrict access to Admins only
  if (isLoaded && user && userRole !== "admin") {
    return (
      <MasterLayout>
        <div className="container mt-5 text-center">
          <h5 className="text-danger">Access Denied</h5>
          <p>Only Admins can view staff join requests.</p>
        </div>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>👥 Staff Join Requests</h4>
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
          <p className="text-muted">
            No staff join requests found for this gym.
          </p>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="card p-3 mb-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>{req.fullName || "Unknown Staff"}</h6>
                  <p className="mb-1 text-muted">
                    {req.requesterEmail || req.adminEmail}
                  </p>
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
                  {req.status?.toUpperCase() || "PENDING"}
                </span>
              </div>

              <hr />
              <p>
                <strong>Gym Code:</strong> {req.gymCode}
              </p>
              <p>
                <strong>Role:</strong> {req.clerkRole || "staff"}
              </p>
              <p>
                <strong>Requested At:</strong>{" "}
                {req.requestedAt
                  ? new Date(req.requestedAt).toLocaleString()
                  : "N/A"}
              </p>

              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleStatusUpdate(req._id, "approve")}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleStatusUpdate(req._id, "reject")}
                >
                  ❌ Reject
                </button>
              </div>

              {req.status === "approved" && (
                <p className="mt-2 text-success small">
                  Approved by: {req.approvedBy || "Admin"}
                </p>
              )}
              {req.status === "rejected" && (
                <p className="mt-2 text-danger small">
                  Rejected by: {req.rejectedBy || "Admin"}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </MasterLayout>
  );
}
