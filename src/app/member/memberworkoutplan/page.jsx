"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import MasterLayout from "../../../masterLayout/MasterLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function MemberWorkoutPlan() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [workouts, setWorkouts] = useState([]);

  // Store dynamic image index per workout row:  "assignmentIndex-workoutIndex"
  const [imageIndexes, setImageIndexes] = useState({});

  useEffect(() => {
    if (isLoaded && user) fetchWorkouts();
  }, [isLoaded, user]);

  const fetchWorkouts = async () => {
    try {
      const token = await getToken();

      const memberEmail = user?.primaryEmailAddress?.emailAddress;
      const gymKey = `joinedGymCode_member_${memberEmail}`;
      const gymCode = localStorage.getItem(gymKey);

      if (!gymCode) {
        console.log("⚠️ No gym code found for member.");
        return;
      }

      const res = await axios.get(
        `${API_BASE}/api/trainer/workouts/member/${gymCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setWorkouts(res.data.workouts);
      }
    } catch (err) {
      console.error("❌ Error loading workouts:", err);
    }
  };

  // Toggle workout image
  const handleToggleImage = (assignmentIndex, workoutIndex, imagesArray) => {
    const key = `${assignmentIndex}-${workoutIndex}`;

    setImageIndexes((prev) => ({
      ...prev,
      [key]: prev[key] + 1 < imagesArray.length ? prev[key] + 1 : 0,
    }));
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold mb-3">My Workout Plan</h2>

        {workouts.length === 0 ? (
          <p className="text-muted">No workouts assigned yet.</p>
        ) : (
          workouts.map((assignment, assignmentIndex) => (
            <div key={assignmentIndex} className="card mb-3 shadow-sm">
              <div className="card-body">
                <h5>
                  Assigned On:{" "}
                  {assignment.fromDate
                    ? new Date(assignment.fromDate).toDateString()
                    : "Unknown"}
                </h5>

                <table className="table table-bordered small text-center mt-3">
                  <thead className="table-light">
                    <tr>
                      <th>Day</th>
                      <th>Workout</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Rest</th>
                      <th>Weight</th>
                      <th>Description</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignment.workouts.map((w, workoutIndex) => {
                      const key = `${assignmentIndex}-${workoutIndex}`;
                      const currentImageIndex = imageIndexes[key] || 0;

                      return (
                        <tr key={workoutIndex}>
                          <td>{w.day}</td>
                          <td>{w.workout}</td>
                          <td>{w.sets}</td>
                          <td>{w.reps}</td>
                          <td>{w.rest} min</td>
                          <td>{w.weight} kg</td>
                          <td>{w.description}</td>

                          <td>
                            {Array.isArray(w.images) && w.images.length > 0 ? (
                              <>
                                <img
                                  src={`/exercises/${w.images[currentImageIndex]}`}
                                  className="img-fluid rounded"
                                  style={{
                                    maxHeight: "80px",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleToggleImage(
                                      assignmentIndex,
                                      workoutIndex,
                                      w.images
                                    )
                                  }
                                />
                                <br />
                                <small className="text-muted">
                                  Click to change image
                                </small>
                              </>
                            ) : (
                              <i>No image</i>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </MasterLayout>
  );
}
