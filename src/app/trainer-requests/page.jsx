"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import MasterLayout from "../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TrainerRequestsPage() {
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinedGymCode, setJoinedGymCode] = useState("");

  // ✅ Load Gym Code from localStorage
  useEffect(() => {
    if (user) {
      const email = user?.primaryEmailAddress?.emailAddress;
      const gymKey = `joinedGymCode_admin_${email}`;
      const code = localStorage.getItem(gymKey);
      if (code) setJoinedGymCode(code);
    }
  }, [user]);

  // ✅ Fetch Trainer Requests
  const fetchRequests = async (showLoading = true) => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (!joinedGymCode) return;

    try {
      if (showLoading) setLoading(true);
      const token = await getToken();

      console.log("📩 Fetching trainer requests for:", joinedGymCode);

      const res = await axios.get(
        `${API_BASE}/api/gym/trainer-requests/${joinedGymCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setRequests(res.data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("❌ Error fetching trainer requests:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (joinedGymCode) fetchRequests(true);
  }, [joinedGymCode, isLoaded, isSignedIn]);

  // ✅ Approve or Reject
  const handleStatusUpdate = async (id, action) => {
    const confirmMsg =
      action === "approve"
        ? "Approve this trainer request?"
        : "Reject this trainer request?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = await getToken();

      await axios.post(
        `${API_BASE}/api/gym/${action}/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 🔄 Update UI without refreshing
      setRequests((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: action === "approve" ? "approved" : "rejected" }
            : r
        )
      );
    } catch (err) {
      console.error(`❌ Error during ${action}:`, err);
      alert("Something went wrong!");
    }
  };

  return (
    <MasterLayout>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold">🏋️ Trainer Join Requests</h3>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => fetchRequests(true)}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="alert alert-info text-center">
            No trainer requests found for this gym.
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="card shadow-sm border-0"
                style={{
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                }}
              >
                <div className="card-body">
                  {/* Top Section */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold mb-1">{req.fullName}</h5>
                      <p className="text-muted mb-0">{req.requesterEmail}</p>
                    </div>

                    <span
                      className={`badge px-3 py-2 ${
                        req.status === "approved"
                          ? "bg-success"
                          : req.status === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                      style={{ fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      {req.status?.toUpperCase() || "PENDING"}
                    </span>
                  </div>

                  <hr />

                  {/* Request Details */}
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong>Gym Code:</strong> {req.gymCode}
                    </p>
                    <p className="mb-1">
                      <strong>Clerk Role:</strong> {req.clerkRole || "trainer"}
                    </p>
                    <p className="mb-1">
                      <strong>Requested At:</strong>{" "}
                      {new Date(req.requestedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Approve/Reject */}
                  <div className="d-flex gap-2 mt-2">
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

                  {/* Status Indicators */}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
