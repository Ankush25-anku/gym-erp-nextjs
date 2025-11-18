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

  // 🔹 Fetch only admin requests for this gym
  const fetchRequests = async (showLoading = true) => {
    if (!isLoaded || !isSignedIn || !user) return;

    const currentEmail = user.primaryEmailAddress?.emailAddress;
    if (!currentEmail) return;

    // Get joined gym code from localStorage
    const gymKey = `joinedGymCode_${userRole}_${currentEmail}`;
    const joinedGymCode = (localStorage.getItem(gymKey) || "").toUpperCase();
    if (!joinedGymCode) return;

    try {
      if (showLoading) setLoading(true);
      const token = await getToken();

      const res = await axios.get(`${API_BASE}/api/gym/requests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: "admin", gymCode: joinedGymCode },
      });

      // 🔹 Filter only clerkRole: admin
      const filteredRequests = res.data.filter(
        (req) => req.clerkRole?.toLowerCase() === "admin"
      );

      setRequests(filteredRequests);
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

  // 🔹 Approve request (update locally)
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this request?")) return;
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE}/api/gym/approve/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "approved" } : r))
      );
    } catch (err) {
      console.error("❌ Error approving request:", err);
    }
  };

  // 🔹 Reject request (update locally)
  const handleReject = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE}/api/gym/reject/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "rejected" } : r))
      );
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
    }
  };

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
          <h4>📋 Admin Join Requests</h4>
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
            No admin join requests found for this gym.
          </p>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="card p-3 mb-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>{req.fullName || "N/A"}</h6>
                  <p className="mb-1 text-muted">{req.adminEmail}</p>
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

              {req.status === "pending" && (
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
              )}

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



