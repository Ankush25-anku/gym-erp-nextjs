"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { useAuth, useUser } from "@clerk/nextjs";
import ModalPortal from "../../../components/ModalPortal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function WorkoutPlanPage() {
  const [members, setMembers] = useState([]);
  const [exerciseOptions, setExerciseOptions] = useState([]);

  // Outside-page states
  const [selectedMemberForFetch, setSelectedMemberForFetch] = useState("");
  const [memberWorkouts, setMemberWorkouts] = useState([]);

  // Popup states
  const [showModal, setShowModal] = useState(false);
  const [selectedMemberEmail, setSelectedMemberEmail] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState("");
  const [editWorkoutIndex, setEditWorkoutIndex] = useState(null);
  const [editWorkout, setEditWorkout] = useState(null);

  const [workoutsList, setWorkoutsList] = useState([
    {
      workout: "",
      sets: "",
      reps: "",
      weight: "",
      rest: "",
      description: "",
      images: [],
      imageIndex: 0,
    },
  ]);

  const { getToken } = useAuth();
  const { user } = useUser();

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
    if (user) {
      fetchMembers();
      fetchExerciseOptions();
    }
  }, [user]);

  // Fetch members
  const fetchMembers = async () => {
    try {
      const token = await getToken();
      const trainerEmail = user?.primaryEmailAddress?.emailAddress;
      const gymKey = `joinedGymCode_trainer_${trainerEmail}`;
      const gymCode = localStorage.getItem(gymKey);

      if (!gymCode) return;

      const res = await axios.get(`${API_BASE}/api/gym/members/${gymCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setMembers(
          res.data.members.map((m) => ({
            name: m.fullName,
            email: m.requesterEmail,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading members:", err);
    }
  };

  // Fetch exercise list
  const fetchExerciseOptions = async () => {
    try {
      const res = await fetch("/data/exercises.json");
      const data = await res.json();
      setExerciseOptions(data);
    } catch (err) {
      console.error("Exercise list error:", err);
    }
  };

  // Handle workout image preview
  const handleWorkoutChange = (index, name) => {
    const selected = exerciseOptions.find((e) => e.name === name);

    const updated = [...workoutsList];
    updated[index].workout = name;
    updated[index].images = selected ? selected.images : [];
    updated[index].imageIndex = 0;

    setWorkoutsList(updated);
  };

  const toggleImage = (index) => {
    const updated = [...workoutsList];
    const imgs = updated[index].images;

    if (imgs.length > 0) {
      updated[index].imageIndex =
        updated[index].imageIndex + 1 < imgs.length
          ? updated[index].imageIndex + 1
          : 0;

      setWorkoutsList(updated);
    }
  };

  // Add workout row
  const addWorkoutRow = () => {
    setWorkoutsList([
      ...workoutsList,
      {
        workout: "",
        sets: "",
        reps: "",
        weight: "",
        rest: "",
        description: "",
        images: [],
        imageIndex: 0,
      },
    ]);
  };

  // Remove workout row
  const deleteWorkoutRow = (index) => {
    if (workoutsList.length === 1)
      return alert("At least one workout required.");
    setWorkoutsList(workoutsList.filter((_, i) => i !== index));
  };

  // Assign workout
  const assignWorkout = async () => {
    if (!selectedMemberEmail) return alert("Select a member.");
    if (!selectedDay) return alert("Select a day.");

    const trainerEmail = user?.primaryEmailAddress?.emailAddress;
    const gymKey = `joinedGymCode_trainer_${trainerEmail}`;
    const gymCode = localStorage.getItem(gymKey);

    const payload = {
      assignedBy: trainerEmail,
      memberEmail: selectedMemberEmail,
      gymCode,
      fromDate: new Date(),
      repeatDays: [],
      workouts: workoutsList.map((w) => ({
        ...w,
        day: selectedDay,
      })),
    };

    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/trainer/workouts`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Workout assigned successfully!");
      setShowModal(false);
      resetModal();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to assign workout.");
    }
  };

  const resetModal = () => {
    setSelectedMemberEmail("");
    setSelectedDay("");
    setWorkoutsList([
      {
        workout: "",
        sets: "",
        reps: "",
        weight: "",
        rest: "",
        description: "",
        images: [],
        imageIndex: 0,
      },
    ]);
  };

  // ⭐ FETCH WORKOUTS OF SELECTED MEMBER
  const fetchMemberWorkout = async () => {
    if (!selectedMemberForFetch)
      return alert("Select a member to fetch workouts.");

    try {
      const token = await getToken();
      const trainerEmail = user?.primaryEmailAddress?.emailAddress;
      const gymKey = `joinedGymCode_trainer_${trainerEmail}`;
      const gymCode = localStorage.getItem(gymKey);

      const res = await axios.get(
        `${API_BASE}/api/trainer/workouts/member-fetch/${gymCode}/${selectedMemberForFetch}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        const formatted = res.data.data.map((block) => ({
          ...block,
          workouts: block.workouts.map((w) => ({
            ...w,
            imageIndex: 0, // ⭐ Add missing index
          })),
        }));

        setMemberWorkouts(formatted);
      } else {
        setMemberWorkouts([]);
      }
    } catch (err) {
      console.error("❌ fetchMemberWorkout ERROR:", err);
      alert("No workouts found for this member.");
    }
  };

  const toggleDisplayImage = (blockIndex, workoutIndex) => {
    setMemberWorkouts((prev) => {
      const updated = [...prev];

      const workout = updated[blockIndex].workouts[workoutIndex];
      if (workout.images?.length > 0) {
        workout.imageIndex =
          workout.imageIndex + 1 < workout.images.length
            ? workout.imageIndex + 1
            : 0;
      }

      return updated;
    });
  };

  const openEdit = (assignmentId, workoutObj, index) => {
    setEditAssignmentId(assignmentId);
    setEditWorkoutIndex(index);

    setEditWorkout({
      ...workoutObj,
      imageIndex: 0, // ⭐ Ensure preview works
      images: workoutObj.images || [], // ⭐ Ensure array exists
    });

    setShowEditModal(true);
  };

  const saveEditedWorkout = async () => {
    try {
      const token = await getToken();

      // Modify ONLY the selected workout inside assignment
      const updatedBlock = memberWorkouts.find(
        (a) => a._id === editAssignmentId
      );
      updatedBlock.workouts[editWorkoutIndex] = editWorkout;

      // Send update request
      await axios.put(
        `${API_BASE}/api/trainer/workouts/${editAssignmentId}`,
        updatedBlock,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Workout updated!");
      setShowEditModal(false);
      fetchMemberWorkout(); // reload list
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  };

  const deleteSingleWorkout = async (assignmentId, index) => {
    if (!confirm("Delete this workout?")) return;

    try {
      const token = await getToken();
      const block = memberWorkouts.find((a) => a._id === assignmentId);

      block.workouts.splice(index, 1); // remove one workout

      await axios.put(
        `${API_BASE}/api/trainer/workouts/${assignmentId}`,
        block,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Workout deleted!");
      fetchMemberWorkout();
    } catch (err) {
      console.error(err);
      alert("Delete failed!");
    }
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        {/* SELECT MEMBER & FETCH BUTTON */}
        {/* SELECT MEMBER & ADD WORKOUT BUTTON ROW */}
        <div className="card p-3 shadow-sm mb-4">
          {/* HEADER ROW */}
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Select Member to View Workouts</h4>

            {/* ADD WORKOUT BUTTON (TOP RIGHT) */}
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Add Workout
            </button>
          </div>

          {/* MEMBER DROPDOWN */}
          <select
            className="form-select mt-3"
            value={selectedMemberForFetch}
            onChange={(e) => setSelectedMemberForFetch(e.target.value)}
          >
            <option value="">-- Select Member --</option>
            {members.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>

          {/* FETCH BUTTON */}
          <button
            className="btn btn-success mt-3 w-100"
            onClick={fetchMemberWorkout}
          >
            Fetch Workouts
          </button>
        </div>

        {/* DISPLAY MEMBER WORKOUT LIST */}
        {memberWorkouts.length > 0 && (
          <div className="card shadow-sm p-3 mb-4">
            <h4 className="mb-3">Assigned Workouts</h4>

            {memberWorkouts.map((block, idx) => (
              <div key={idx} className="mb-3">
                <h5>
                  Day: <b>{block.workouts[0]?.day || "No Day"}</b>
                </h5>

                <table className="table table-bordered small mt-2">
                  <thead>
                    <tr>
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
                    {block.workouts.map((w, i) => (
                      <tr key={i}>
                        <td>{w.workout}</td>
                        <td>{w.sets}</td>
                        <td>{w.reps}</td>
                        <td>{w.rest}</td>
                        <td>{w.weight}</td>
                        <td>{w.description}</td>

                        <td>
                          {w.images?.length > 0 ? (
                            <img
                              src={`/exercises/${w.images[w.imageIndex]}`}
                              width="70"
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleDisplayImage(idx, i)}
                            />
                          ) : (
                            "--"
                          )}
                        </td>

                        {/* EDIT BUTTON */}
                        <td>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => openEdit(block._id, w, i)}
                          >
                            Edit
                          </button>
                        </td>

                        {/* DELETE BUTTON */}
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteSingleWorkout(block._id, i)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ADD WORKOUT BUTTON */}

        {/* POPUP MODAL FOR ADDING WORKOUT */}
        {showModal && (
          <ModalPortal>
            <div className="modal-backdrop fade show"></div>

            <div className="modal fade show d-block">
              <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content p-4">
                  <h3>Add Workout</h3>

                  {/* MEMBER SELECT */}
                  <label className="form-label">Member</label>
                  <select
                    className="form-select"
                    value={selectedMemberEmail}
                    onChange={(e) => setSelectedMemberEmail(e.target.value)}
                  >
                    <option value="">-- Select Member --</option>
                    {members.map((m) => (
                      <option key={m.email} value={m.email}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>

                  {/* DAY SELECT */}
                  <label className="form-label mt-3">Day</label>
                  <select
                    className="form-select"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    <option value="">-- Select Day --</option>
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  {workoutsList.map((w, index) => (
                    <div key={index} className="border p-3 mt-3">
                      <h5>
                        Workout #{index + 1}{" "}
                        {workoutsList.length > 1 && (
                          <button
                            className="btn btn-danger btn-sm float-end"
                            onClick={() => deleteWorkoutRow(index)}
                          >
                            Remove
                          </button>
                        )}
                      </h5>

                      {/* Workout select */}
                      <label className="form-label">Workout</label>
                      <select
                        className="form-select"
                        value={w.workout}
                        onChange={(e) =>
                          handleWorkoutChange(index, e.target.value)
                        }
                      >
                        <option value="">-- Select Workout --</option>
                        {exerciseOptions.map((ex) => (
                          <option key={ex.id} value={ex.name}>
                            {ex.name}
                          </option>
                        ))}
                      </select>

                      {/* Image preview */}
                      {w.images.length > 0 && (
                        <div className="text-center mt-2">
                          <img
                            src={`/exercises/${w.images[w.imageIndex]}`}
                            style={{ maxHeight: "160px", cursor: "pointer" }}
                            onClick={() => toggleImage(index)}
                          />
                        </div>
                      )}

                      <div className="row mt-2 g-3">
                        <div className="col-md-6">
                          <label>Sets</label>
                          <input
                            className="form-control"
                            value={w.sets}
                            onChange={(e) => {
                              const updated = [...workoutsList];
                              updated[index].sets = e.target.value;
                              setWorkoutsList(updated);
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label>Reps</label>
                          <input
                            className="form-control"
                            value={w.reps}
                            onChange={(e) => {
                              const updated = [...workoutsList];
                              updated[index].reps = e.target.value;
                              setWorkoutsList(updated);
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label>Weight</label>
                          <input
                            className="form-control"
                            value={w.weight}
                            onChange={(e) => {
                              const updated = [...workoutsList];
                              updated[index].weight = e.target.value;
                              setWorkoutsList(updated);
                            }}
                          />
                        </div>

                        <div className="col-md-6">
                          <label>Rest (min)</label>
                          <input
                            className="form-control"
                            value={w.rest}
                            onChange={(e) => {
                              const updated = [...workoutsList];
                              updated[index].rest = e.target.value;
                              setWorkoutsList(updated);
                            }}
                          />
                        </div>

                        <div className="col-12">
                          <label>Description</label>
                          <textarea
                            className="form-control"
                            value={w.description}
                            onChange={(e) => {
                              const updated = [...workoutsList];
                              updated[index].description = e.target.value;
                              setWorkoutsList(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add more workout */}
                  <button
                    className="btn btn-outline-primary w-100 mt-3"
                    onClick={addWorkoutRow}
                  >
                    + Add Workout
                  </button>

                  {/* Submit */}
                  <button
                    className="btn btn-success w-100 mt-3"
                    onClick={assignWorkout}
                  >
                    SubmitWorkout
                  </button>

                  <button
                    className="btn btn-secondary w-100 mt-2"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {showEditModal && editWorkout && (
          <ModalPortal>
            <div className="modal-backdrop fade show"></div>

            <div className="modal fade show d-block">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content p-4">
                  <h3>Edit Workout</h3>

                  {/* DAY SELECT */}
                  <label className="form-label">Day</label>
                  <select
                    className="form-select"
                    value={editWorkout.day}
                    onChange={(e) =>
                      setEditWorkout({ ...editWorkout, day: e.target.value })
                    }
                  >
                    <option value="">-- Select Day --</option>
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  {/* Workout name */}
                  <label className="form-label mt-3">Workout</label>
                  <select
                    className="form-select"
                    value={editWorkout.workout}
                    onChange={(e) => {
                      const selected = exerciseOptions.find(
                        (ex) => ex.name === e.target.value
                      );

                      setEditWorkout({
                        ...editWorkout,
                        workout: e.target.value,
                        images: selected ? selected.images : [],
                        imageIndex: 0,
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

                  {/* Image Preview */}
                  {editWorkout.images?.length > 0 && (
                    <div className="text-center mt-2">
                      <img
                        src={`/exercises/${
                          editWorkout.images[editWorkout.imageIndex]
                        }`}
                        style={{ maxHeight: "160px", cursor: "pointer" }}
                        onClick={() =>
                          setEditWorkout({
                            ...editWorkout,
                            imageIndex:
                              editWorkout.imageIndex + 1 <
                              editWorkout.images.length
                                ? editWorkout.imageIndex + 1
                                : 0,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Sets */}
                  <label className="form-label mt-2">Sets</label>
                  <input
                    className="form-control"
                    value={editWorkout.sets}
                    onChange={(e) =>
                      setEditWorkout({ ...editWorkout, sets: e.target.value })
                    }
                  />

                  {/* Reps */}
                  <label className="form-label mt-2">Reps</label>
                  <input
                    className="form-control"
                    value={editWorkout.reps}
                    onChange={(e) =>
                      setEditWorkout({ ...editWorkout, reps: e.target.value })
                    }
                  />

                  {/* Weight */}
                  <label className="form-label mt-2">Weight</label>
                  <input
                    className="form-control"
                    value={editWorkout.weight}
                    onChange={(e) =>
                      setEditWorkout({ ...editWorkout, weight: e.target.value })
                    }
                  />

                  {/* Rest */}
                  <label className="form-label mt-2">Rest (min)</label>
                  <input
                    className="form-control"
                    value={editWorkout.rest}
                    onChange={(e) =>
                      setEditWorkout({ ...editWorkout, rest: e.target.value })
                    }
                  />

                  {/* Description */}
                  <label className="form-label mt-2">Description</label>
                  <textarea
                    className="form-control"
                    value={editWorkout.description}
                    onChange={(e) =>
                      setEditWorkout({
                        ...editWorkout,
                        description: e.target.value,
                      })
                    }
                  />

                  {/* Save */}
                  <button
                    className="btn btn-success w-100 mt-3"
                    onClick={saveEditedWorkout}
                  >
                    Save Changes
                  </button>

                  <button
                    className="btn btn-secondary w-100 mt-2"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </MasterLayout>
  );
}
