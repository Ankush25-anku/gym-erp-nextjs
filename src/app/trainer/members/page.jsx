"use client";

import { useEffect, useState } from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function TrainerMembersPage() {
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedWorkoutMember, setSelectedWorkoutMember] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [assignType, setAssignType] = useState("member");
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "",
    status: "active",
    expires: "",
    joined: "",
  });
  const [workouts, setWorkouts] = useState([
    {
      day: "Monday",
      workout: "Pull-ups",
      weight: 10,
      sets: 3,
      reps: 4,
      rest: 5,
      description: "Work out for that day",
    },
  ]);
  const [exerciseList, setExerciseList] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [imageIndex, setImageIndex] = useState({});

  useEffect(() => {
    fetchMembers();
    fetchExercises();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/trainer/members`);
      setMembers(res.data);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await fetch("/data/exercises.json");
      const data = await res.json();
      setExerciseList(data);
    } catch (err) {
      console.error("Failed to load exercises.json", err);
    }
  };

  const handleWorkoutChange = (index, workoutName) => {
  const updated = [...workouts];
  updated[index].workout = workoutName;

  const found = exerciseList.find((ex) => ex.name === workoutName);
  const images = found?.images || [];

  // ✅ Attach images directly to workout for DB storage
  updated[index].images = images;

  setWorkouts(updated);

  // ✅ For preview logic (optional UI)
  setSelectedImages((prev) => ({
    ...prev,
    [index]: images,
  }));
  setImageIndex((prev) => ({
    ...prev,
    [index]: 0,
  }));
};


  const handleImageClick = (index) => {
    setImageIndex((prev) => {
      const currentIndex = prev[index] || 0;
      const total = selectedImages[index]?.length || 0;
      const nextIndex = (currentIndex + 1) % total;
      return {
        ...prev,
        [index]: nextIndex,
      };
    });
  };

const handleAssignWorkout = async () => {
  try {
    if (!selectedWorkoutMember?._id) {
      alert("No member selected for workout assignment.");
      return;
    }

    const payload = {
      workouts, // full workout list with day, workout, images, etc.
    };

    await axios.post(
      `${API_BASE}/api/trainer/members/assign-workout/${selectedWorkoutMember._id}`,
      payload
    );

    alert("Workout assigned successfully!");
    setShowWorkoutModal(false);
  } catch (err) {
    console.error("Failed to assign workout:", err);
    alert("Failed to assign workout");
  }
};


  const handleAddMember = async () => {
    try {
      const initials = newMember.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      const payload = { ...newMember, initials };

      const res = await axios.post(`${API_BASE}/api/trainer/members`, payload);
      setMembers((prev) => [...prev, res.data]);

      setNewMember({
        name: "",
        email: "",
        phone: "",
        plan: "",
        status: "active",
        expires: "",
        joined: "",
      });
      setShowModal(false);
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const filtered = members.filter((m) => {
    const status = m.status || "";
    const name = m.name || "";
    const email = m.email || "";
    const matchStatus = filter === "all" || status === filter;
    const query = search.toLowerCase();
    const matchSearch =
      name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold">My Members</h2>
            <p className="text-muted">
              Manage member profiles, subscriptions, and information
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Add Member</Button>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center my-3">
          <input
            type="text"
            className="form-control w-50"
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="btn-group ms-auto">
            <button
              className={`btn btn-outline-dark ${
                filter === "all" ? "active" : ""
              }`}
              onClick={() => setFilter("all")}
            >
              All Members
            </button>
            <button
              className={`btn btn-outline-dark ${
                filter === "active" ? "active" : ""
              }`}
              onClick={() => setFilter("active")}
            >
              Active
            </button>
            <button
              className={`btn btn-outline-dark ${
                filter === "expired" ? "active" : ""
              }`}
              onClick={() => setFilter("expired")}
            >
              Expired
            </button>
          </div>
        </div>

        <div className="row">
          {filtered.map((member) => (
            <div key={member._id || member.email} className="col-md-4 mb-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="bg-light text-primary rounded-circle fw-bold d-flex justify-content-center align-items-center"
                        style={{ width: 40, height: 40 }}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <h6 className="mb-0">{member.name}</h6>
                        <small className="text-muted">{member.email}</small>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        member.status === "active" ? "bg-success" : "bg-danger"
                      } text-capitalize`}
                      style={{ fontSize: "0.8rem" }}
                    >
                      {member.status}
                    </span>
                  </div>

                  <hr />

                  <p className="mb-1">
                    <strong>Plan:</strong> {member.plan}
                  </p>
                  <p className="mb-1">
                    <strong>Expires:</strong> {member.expires}
                  </p>
                  <p className="mb-1">
                    <strong>📞</strong> {member.phone}
                  </p>

                  {member.status === "active" && (
                    <p className="mb-1 text-muted">
                      <strong>📋</strong> Assigned Trainer
                    </p>
                  )}

                  <hr />

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Joined {member.joined}</small>
                    <div>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setSelectedWorkoutMember(member);
                          setShowWorkoutModal(true);
                        }}
                      >
                        Assign Workout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Member</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={newMember.phone}
                  onChange={(e) =>
                    setNewMember({ ...newMember, phone: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Plan</Form.Label>
                <Form.Control
                  type="text"
                  value={newMember.plan}
                  onChange={(e) =>
                    setNewMember({ ...newMember, plan: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={newMember.status}
                  onChange={(e) =>
                    setNewMember({ ...newMember, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Expires</Form.Label>
                <Form.Control
                  type="date"
                  value={newMember.expires}
                  onChange={(e) =>
                    setNewMember({ ...newMember, expires: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Joined</Form.Label>
                <Form.Control
                  type="date"
                  value={newMember.joined}
                  onChange={(e) =>
                    setNewMember({ ...newMember, joined: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddMember}>
              Add
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showWorkoutModal}
          onHide={() => {
            setShowWorkoutModal(false);
            setSelectedWorkoutMember(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Assign Workouts</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Assigned By</Form.Label>
                <Form.Control type="text" value="John Anderson" disabled />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Assign To</Form.Label>
                <br />
                <Form.Check
                  inline
                  label="Member"
                  name="assignTo"
                  type="radio"
                  checked={assignType === "member"}
                  onChange={() => setAssignType("member")}
                />
                <Form.Check
                  inline
                  label="Class"
                  name="assignTo"
                  type="radio"
                  checked={assignType === "class"}
                  onChange={() => setAssignType("class")}
                />
              </Form.Group>

              {assignType === "member" ? (
                <Form.Group className="mb-3">
                  <Form.Label>Member</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedWorkoutMember?.name || ""}
                    disabled
                  />
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Class</Form.Label>
                  <Form.Select>
                    <option>Yoga</option>
                    <option>Zumba</option>
                    <option>Crossfit</option>
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>No Of Days Repeat</Form.Label>
                <Form.Control type="number" />
              </Form.Group>

              <hr />

              <h6 className="fw-bold">Workouts</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover align-middle text-nowrap text-center">
                  <thead className="table-light">
                    <tr>
                      <th>Day</th>
                      <th>Workout</th>
                      <th>Weight (Kg)</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Rest (min)</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.map((w, index) => (
                      <>
                        <tr key={index}>
                          <td>
                            <Form.Select
                              className="form-select-sm"
                              value={w.day}
                              onChange={(e) => {
                                const updated = [...workouts];
                                updated[index].day = e.target.value;
                                setWorkouts(updated);
                              }}
                            >
                              <option>Monday</option>
                              <option>Tuesday</option>
                              <option>Wednesday</option>
                              <option>Thursday</option>
                              <option>Friday</option>
                              <option>Saturday</option>
                              <option>Sunday</option>
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Select
                              className="form-select-sm"
                              value={w.workout}
                              onChange={(e) =>
                                handleWorkoutChange(index, e.target.value)
                              }
                            >
                              <option>Select Workout</option>
                              {exerciseList.map((ex, i) => (
                                <option key={i} value={ex.name}>
                                  {ex.name}
                                </option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              className="form-control-sm"
                              value={w.weight}
                              onChange={(e) => {
                                const updated = [...workouts];
                                updated[index].weight = e.target.value;
                                setWorkouts(updated);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              className="form-control-sm"
                              value={w.sets}
                              onChange={(e) => {
                                const updated = [...workouts];
                                updated[index].sets = e.target.value;
                                setWorkouts(updated);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              className="form-control-sm"
                              value={w.reps}
                              onChange={(e) => {
                                const updated = [...workouts];
                                updated[index].reps = e.target.value;
                                setWorkouts(updated);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              className="form-control-sm"
                              value={w.rest}
                              onChange={(e) => {
                                const updated = [...workouts];
                                updated[index].rest = e.target.value;
                                setWorkouts(updated);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              className="form-control-sm"
                              value={w.description}
                              onChange={(e) => {
                                const updated = [...workouts];
                                updated[index].description = e.target.value;
                                setWorkouts(updated);
                              }}
                            />
                          </td>
                        </tr>
                        {selectedImages[index]?.length > 0 && (
                          <tr>
                            <td colSpan="7">
                              <div className="d-flex justify-content-center flex-wrap">
                                <img
                                  src={`/exercises/${
                                    selectedImages[index][
                                      imageIndex[index] || 0
                                    ]
                                  }`}
                                  alt="Workout Preview"
                                  style={{
                                    maxHeight: "160px",
                                    cursor: "pointer",
                                    borderRadius: "8px",
                                  }}
                                  onClick={() => handleImageClick(index)}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/fallback.png";
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                variant="link"
                className="text-primary"
                onClick={() =>
                  setWorkouts((prev) => [
                    ...prev,
                    {
                      day: "Monday",
                      workout: "Pull-ups",
                      weight: 0,
                      sets: 0,
                      reps: 0,
                      rest: 0,
                      description: "",
                    },
                  ])
                }
              >
                + Add New
              </Button>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowWorkoutModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleAssignWorkout}>
              Assign
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </MasterLayout>
  );
}
