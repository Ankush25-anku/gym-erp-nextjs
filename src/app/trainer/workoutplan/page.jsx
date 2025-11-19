"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function WorkoutPlanPage() {
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [imageIndexes, setImageIndexes] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editWorkoutIndex, setEditWorkoutIndex] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [updatedMember, setUpdatedMember] = useState({});
  const [exerciseOptions, setExerciseOptions] = useState([]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchMembers();
    fetchExerciseOptions();

    const savedMemberId = localStorage.getItem("selectedMemberId");
    if (savedMemberId) {
      setSelectedMemberId(savedMemberId);
    }
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/trainer/members`);
      setMembers(res.data);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const fetchExerciseOptions = async () => {
    try {
      const res = await fetch("/data/exercises.json");
      const data = await res.json();
      setExerciseOptions(data);
    } catch (err) {
      console.error("Failed to load exercise options:", err);
    }
  };

  const handleToggleImage = (memberId, workoutIndex) => {
    const key = `${memberId}-${workoutIndex}`;
    setImageIndexes((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }));
  };

  const handleEditWorkoutClick = (member, workoutIndex) => {
    setEditMember(member);
    setEditWorkoutIndex(workoutIndex);
    setUpdatedMember({ ...member });
    const key = `edit-${workoutIndex}`;
    setImageIndexes((prev) => ({ ...prev, [key]: 0 }));
    setShowEditModal(true);
  };

  const handleWorkoutFieldChange = (field, value) => {
    const workouts = [...updatedMember.assignedWorkouts];
    workouts[editWorkoutIndex][field] = value;
    if (field === "workout") {
      const selected = exerciseOptions.find((e) => e.name === value);
      workouts[editWorkoutIndex].images = selected ? selected.images : [];
      setImageIndexes((prev) => ({ ...prev, [`edit-${editWorkoutIndex}`]: 0 }));
    }
    setUpdatedMember({ ...updatedMember, assignedWorkouts: workouts });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `${API_BASE}/api/trainer/members/${editMember._id}`,
        updatedMember
      );
      setShowEditModal(false);
      fetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const selectedMember = members.find((m) => m._id === selectedMemberId);

  const getEditImageToggle = () => {
    const key = `edit-${editWorkoutIndex}`;
    const images =
      updatedMember?.assignedWorkouts?.[editWorkoutIndex]?.images || [];
    const currentIndex = imageIndexes[key] || 0;
    const currentImage = images[currentIndex];

    const handleClick = () => {
      setImageIndexes((prev) => ({
        ...prev,
        [key]: (prev[key] + 1) % images.length,
      }));
    };

   

    return (
      images.length > 0 && (
        <img
          src={`/exercises/${currentImage}`}
          alt="Workout"
          style={{
            maxHeight: "160px",
            width: "100%",
            objectFit: "contain",
            cursor: "pointer",
            borderRadius: "8px",
          }}
          onClick={handleClick}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/fallback.png";
          }}
        />
      )
    );
  };


   const handleDeleteWorkout = async (index) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this workout?");
  if (!confirmDelete) return;

  try {
    const updated = {
      ...selectedMember,
      assignedWorkouts: selectedMember.assignedWorkouts.filter((_, i) => i !== index),
    };

   await axios.delete(`${API_BASE}/api/trainer/members/${selectedMember._id}/workouts/${index}`);

    fetchMembers();
  } catch (error) {
    console.error("Failed to delete workout:", error);
    alert("Error deleting workout.");
  }
};

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold mb-3">Workout Plan Summary</h2>

        <div className="mb-3">
          <label className="form-label">Select Member</label>
          <select
            className="form-select"
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              localStorage.setItem("selectedMemberId", e.target.value);
            }}
          >
            <option value="">-- Select Member --</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {selectedMember ? (
          <div key={selectedMember._id} className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5>
                {selectedMember.name}{" "}
                <span className="badge bg-secondary">
                  {selectedMember.status}
                </span>
              </h5>
              <p>
                <strong>ID:</strong> {selectedMember._id}
              </p>
              <p>
                <strong>Email:</strong> {selectedMember.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedMember.phone}
              </p>
              <p>
                <strong>Plan:</strong> {selectedMember.plan}
              </p>
              <p>
                <strong>Expires:</strong> {selectedMember.expires}
              </p>
              <p>
                <strong>Joined:</strong> {selectedMember.joined}
              </p>
              <p>
                <strong>Initials:</strong> {selectedMember.initials}
              </p>
              <button
                className="btn btn-primary my-2"
                onClick={() => handleEditWorkoutClick(selectedMember, null)}
              >
                Edit Member Info
              </button>

              {Array.isArray(selectedMember.assignedWorkouts) &&
              selectedMember.assignedWorkouts.length > 0 ? (
                <table className="table table-bordered small text-center">
                  <thead className="table-light">
                    <tr>
                      <th>Day</th>
                      <th>Workout</th>
                      <th>Weight</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Rest</th>
                      <th>Description</th>
                      <th>Images</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMember.assignedWorkouts.map((w, i) => (
                      <tr key={w._id || i}>
                        <td>{w.day}</td>
                        <td>{w.workout}</td>
                        <td>{w.weight} kg</td>
                        <td>{w.sets}</td>
                        <td>{w.reps}</td>
                        <td>{w.rest} min</td>
                        <td>{w.description}</td>
                        <td>
                          {Array.isArray(w.images) && w.images.length > 0 ? (
                            <img
                              src={`/exercises/${
                                w.images[
                                  imageIndexes[`${selectedMember._id}-${i}`] ||
                                    0
                                ]
                              }`}
                              alt={w.workout}
                              className="img-fluid rounded"
                              style={{
                                maxWidth: "100%",
                                height: "auto",
                                maxHeight: "200px",
                                cursor: "pointer",
                                objectFit: "cover",
                              }}
                              onClick={() =>
                                handleToggleImage(selectedMember._id, i)
                              }
                            />
                          ) : (
                            <span className="text-muted">No image</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() =>
                              handleEditWorkoutClick(selectedMember, i)
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteWorkout(i)}
                            title="Delete Workout"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No workouts assigned.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Please select a member to view their details.</p>
        )}
      </div>

      {showEditModal && updatedMember && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Member or Workout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {editWorkoutIndex === null ? (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          className="form-control"
                          value={updatedMember.email}
                          onChange={(e) =>
                            setUpdatedMember({
                              ...updatedMember,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          className="form-control"
                          value={updatedMember.phone}
                          onChange={(e) =>
                            setUpdatedMember({
                              ...updatedMember,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Plan</label>
                        <input
                          className="form-control"
                          value={updatedMember.plan}
                          onChange={(e) =>
                            setUpdatedMember({
                              ...updatedMember,
                              plan: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Expires</label>
                        <input
                          type="date"
                          className="form-control"
                          value={updatedMember.expires}
                          onChange={(e) =>
                            setUpdatedMember({
                              ...updatedMember,
                              expires: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Joined</label>
                        <input
                          type="date"
                          className="form-control"
                          value={updatedMember.joined}
                          onChange={(e) =>
                            setUpdatedMember({
                              ...updatedMember,
                              joined: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Initials</label>
                        <input
                          className="form-control"
                          value={updatedMember.initials}
                          onChange={(e) =>
                            setUpdatedMember({
                              ...updatedMember,
                              initials: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">Day</label>
                        <select
                          className="form-select"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex].day
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange("day", e.target.value)
                          }
                        >
                          <option value="">-- Select Day --</option>
                          {daysOfWeek.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Workout</label>
                        <select
                          className="form-select"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex]
                              .workout
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange("workout", e.target.value)
                          }
                        >
                          <option value="">-- Select Workout --</option>
                          {exerciseOptions.map((exercise) => (
                            <option key={exercise.id} value={exercise.name}>
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-12 mt-3">
                        {getEditImageToggle()}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Weight (kg)</label>
                        <input
                          className="form-control"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex]
                              .weight
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange("weight", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Sets</label>
                        <input
                          className="form-control"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex]
                              .sets
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange("sets", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Reps</label>
                        <input
                          className="form-control"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex]
                              .reps
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange("reps", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Rest (min)</label>
                        <input
                          className="form-control"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex]
                              .rest
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange("rest", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          value={
                            updatedMember.assignedWorkouts[editWorkoutIndex]
                              .description
                          }
                          onChange={(e) =>
                            handleWorkoutFieldChange(
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      {updatedMember.assignedWorkouts[editWorkoutIndex]
                        .images?.[0] && (
                        <div className="col-12">
                       
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}
