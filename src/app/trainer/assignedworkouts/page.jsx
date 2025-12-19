"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { useAuth, useUser } from "@clerk/nextjs";
import ModalPortal from "../../../components/ModalPortal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AssignedWorkoutsPage() {
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);

  // --- EDIT MODAL STATES ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editImageIndex, setEditImageIndex] = useState(0);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const { getToken } = useAuth();
  const { user } = useUser();

  const fetchExerciseOptions = async () => {
    try {
      const res = await fetch("/data/exercises.json");
      const data = await res.json();
      setExerciseOptions(data);
    } catch (err) {
      console.error("Failed to load exercises:", err);
    }
  };

  // Fetch assigned workouts
  const fetchAllWorkouts = async () => {
    try {
      const token = await getToken();
      const trainerEmail = user?.primaryEmailAddress?.emailAddress;
      const gymKey = `joinedGymCode_trainer_${trainerEmail}`;
      const gymCode = localStorage.getItem(gymKey);

      const res = await axios.get(
        `${API_BASE}/api/trainer/workouts/all/${gymCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setAssignedWorkouts(res.data.workouts);
      }
    } catch (err) {
      console.error("❌ Error fetching workouts:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExerciseOptions(); // ⭐ NEW
      fetchAllWorkouts();
    }
  }, [user]);

  // Open modal
  const openEditModal = (w) => {
    setEditingAssignment(JSON.parse(JSON.stringify(w))); // deep clone
    setEditImageIndex(0);
    setEditModalOpen(true);
  };

  // Toggle image
  const toggleImage = () => {
    const imgs = editingAssignment.workouts[0].images;
    if (!imgs?.length) return;

    setEditImageIndex((prev) => (prev + 1 < imgs.length ? prev + 1 : 0));
  };

  // Save edited workout
  const saveEdit = async () => {
    try {
      const token = await getToken();

      await axios.put(
        `${API_BASE}/api/trainer/workouts/${editingAssignment._id}`,
        editingAssignment,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Workout updated successfully!");
      setEditModalOpen(false);
      fetchAllWorkouts();
    } catch (err) {
      console.error("❌ Error updating workout:", err);
    }
  };

  // Delete a workout
  const deleteWorkout = async (id) => {
    if (!confirm("Delete this workout?")) return;

    try {
      const token = await getToken();

      await axios.delete(`${API_BASE}/api/trainer/workouts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Workout deleted!");
      fetchAllWorkouts();
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold mb-4">All Assigned Workouts</h2>

        {assignedWorkouts.map((w) => (
          <div key={w._id} className="card shadow-sm p-3 mb-3">
            <h5>
              <b>{w.memberEmail}</b> • Assigned on{" "}
              {new Date(w.fromDate).toDateString()}
            </h5>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openEditModal(w)}
              >
                Edit
              </button>

              <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteWorkout(w._id)}
              >
                Delete
              </button>
            </div>

            <table className="table table-bordered text-center small mt-3">
              <thead>
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
                {w.workouts.map((x, i) => (
                  <tr key={i}>
                    <td>{x.day}</td>
                    <td>{x.workout}</td>
                    <td>{x.sets}</td>
                    <td>{x.reps}</td>
                    <td>{x.rest} min</td>
                    <td>{x.weight} kg</td>
                    <td>{x.description}</td>
                    <td>
                      {x.images?.length > 0 ? (
                        <img
                          src={`/exercises/${x.images[0]}`}
                          style={{ maxHeight: "80px" }}
                        />
                      ) : (
                        <i>No Image</i>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* --- EDIT MODAL --- */}
        {editModalOpen && editingAssignment && (
          <ModalPortal>
            {/* BACKDROP */}
            <div className="modal-backdrop fade show"></div>

            {/* WRAPPER */}
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ zIndex: 1100 }}
            >
              <div
                className="modal-dialog modal-xl modal-dialog-centered"
                style={{ maxWidth: "95%", margin: "0 auto" }} // mobile friendly
              >
                <div
                  className="modal-content p-3"
                  style={{
                    maxHeight: "90vh",
                    overflowY: "auto",
                    borderRadius: "12px",
                  }}
                >
                  {/* HEADER */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="m-0">Edit Assigned Workouts</h3>

                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>

                  {/* WORKOUT LIST */}
                  {editingAssignment.workouts.map((workout, index) => (
                    <div
                      key={index}
                      className="border rounded p-3 mb-4 bg-light"
                    >
                      {/* HEADER Row */}
                      <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <h5 className="m-0">Workout #{index + 1}</h5>

                        {editingAssignment.workouts.length > 1 && (
                          <button
                            className="btn btn-danger btn-sm mt-2 mt-md-0"
                            onClick={() => {
                              const updated = editingAssignment.workouts.filter(
                                (_, i) => i !== index
                              );
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          >
                            Delete Workout
                          </button>
                        )}
                      </div>

                      {/* IMAGE PREVIEW */}
                      {workout.images?.length > 0 && (
                        <div className="text-center">
                          <img
                            src={`/exercises/${workout.images[editImageIndex]}`}
                            className="img-fluid rounded mt-2"
                            style={{ maxHeight: "200px", cursor: "pointer" }}
                            onClick={() =>
                              setEditImageIndex(
                                editImageIndex + 1 < workout.images.length
                                  ? editImageIndex + 1
                                  : 0
                              )
                            }
                          />
                          <small className="text-muted d-block mt-1">
                            Tap image to change
                          </small>
                        </div>
                      )}

                      {/* FORM FIELDS */}
                      <div className="row g-3 mt-2">
                        {/* DAY DROPDOWN */}
                        <div className="col-md-4 col-12">
                          <label className="form-label">Day</label>
                          <select
                            className="form-select"
                            value={workout.day}
                            onChange={(e) => {
                              const updated = [...editingAssignment.workouts];
                              updated[index].day = e.target.value;
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          >
                            <option value="">-- Select Day --</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                          </select>
                        </div>

                        {/* WORKOUT DROPDOWN */}
                        <div className="col-md-4 col-12">
                          <label className="form-label">Workout</label>
                          <select
                            className="form-select"
                            value={workout.workout}
                            onChange={(e) => {
                              const selected = exerciseOptions.find(
                                (x) => x.name === e.target.value
                              );

                              const updated = [...editingAssignment.workouts];
                              updated[index].workout = e.target.value;
                              updated[index].images = selected
                                ? selected.images
                                : [];

                              setEditImageIndex(0);
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          >
                            <option value="">-- Select Workout --</option>
                            {exerciseOptions.map((ex) => (
                              <option key={ex.id} value={ex.name}>
                                {ex.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* SETS */}
                        <div className="col-md-4 col-12">
                          <label className="form-label">Sets</label>
                          <input
                            className="form-control"
                            value={workout.sets}
                            onChange={(e) => {
                              const updated = [...editingAssignment.workouts];
                              updated[index].sets = e.target.value;
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          />
                        </div>

                        {/* REPS */}
                        <div className="col-md-4 col-12">
                          <label className="form-label">Reps</label>
                          <input
                            className="form-control"
                            value={workout.reps}
                            onChange={(e) => {
                              const updated = [...editingAssignment.workouts];
                              updated[index].reps = e.target.value;
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          />
                        </div>

                        {/* WEIGHT */}
                        <div className="col-md-4 col-12">
                          <label className="form-label">Weight (kg)</label>
                          <input
                            className="form-control"
                            value={workout.weight}
                            onChange={(e) => {
                              const updated = [...editingAssignment.workouts];
                              updated[index].weight = e.target.value;
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          />
                        </div>

                        {/* REST */}
                        <div className="col-md-4 col-12">
                          <label className="form-label">Rest (min)</label>
                          <input
                            className="form-control"
                            value={workout.rest}
                            onChange={(e) => {
                              const updated = [...editingAssignment.workouts];
                              updated[index].rest = e.target.value;
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          />
                        </div>

                        {/* DESCRIPTION */}
                        <div className="col-12">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            value={workout.description}
                            onChange={(e) => {
                              const updated = [...editingAssignment.workouts];
                              updated[index].description = e.target.value;
                              setEditingAssignment({
                                ...editingAssignment,
                                workouts: updated,
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ACTION BUTTONS */}
                  <div className="text-end mt-3">
                    <button
                      className="btn btn-secondary me-2"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Cancel
                    </button>

                    <button className="btn btn-primary" onClick={saveEdit}>
                      Save All Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </MasterLayout>
  );
}
