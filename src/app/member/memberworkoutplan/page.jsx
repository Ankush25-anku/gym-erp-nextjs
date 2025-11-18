"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function MemberWorkoutPlan() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/member/workout-plans/all`);
        setMembers(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch all members:", err);
        setError("Failed to load members.");
      }
    };

    fetchAllMembers();
  }, []);

  if (error) return <div className="text-danger">{error}</div>;
  if (members.length === 0) return <div>Loading...</div>;

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">All Member Workout Plans</h2>

        {members.map((member, i) => (
          <div key={member._id} className="card mb-4 p-3 shadow-sm">
            <h5 className="fw-bold">{member.name}</h5>
            <p>Email: {member.email}</p>
            <p>Phone: {member.phone}</p>
            <p>Plan: {member.plan}</p>
            <p>Status: {member.status}</p>
            <p>Joined: {member.joined}</p>
            <p>Expires: {member.expires}</p>

            <h6 className="fw-bold mt-3">Assigned Workouts:</h6>
            {member.assignedWorkouts?.length === 0 ? (
              <p className="text-muted">No workouts assigned.</p>
            ) : (
              member.assignedWorkouts.map((w, wi) => (
                <div key={wi} className="border p-2 mb-2 rounded">
                  <strong>Day:</strong> {w.day} <br />
                  <strong>Workout:</strong> {w.workout} <br />
                  <strong>Weight:</strong> {w.weight} kg
                  <br />
                  <strong>Sets:</strong> {w.sets}
                  <br />
                  <strong>Reps:</strong> {w.reps}
                  <br />
                  <strong>Rest:</strong> {w.rest} min
                  <br />
                  <strong>Description:</strong> {w.description}
                  <br />
                  {w.images?.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {w.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`/exercises/${img}`}
                          alt="Workout Image"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/fallback.png";
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </MasterLayout>
  );
}
