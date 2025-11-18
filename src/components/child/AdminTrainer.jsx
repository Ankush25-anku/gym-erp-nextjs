"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser, useAuth } from "@clerk/nextjs";
import { Button, Modal, Form } from "react-bootstrap";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/admintrainers`;

const TrainerManagement = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [gyms, setGyms] = useState([]);

  const fetchTrainers = async () => {
    try {
      const token = await getToken({ template: "backend" }); // ✅ ensure backend token
      if (!token) return;

      console.log("🔹 Fetching trainers with token:", token);

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Trainers fetched:", res.data);
      setTrainers(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch trainers:", err?.response || err);
      if (err?.response?.status === 401)
        alert("Unauthorized. Please login again.");
    }
  };

  const fetchGyms = async () => {
    try {
      const token = await getToken();
      if (!token || !user) return;

      const role =
        user?.publicMetadata?.role || user?.unsafeMetadata?.role || "member";

      const url =
        role === "superadmin"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/gyms`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/gyms/my`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const gymList = Array.isArray(res.data) ? res.data : res.data.gyms || [];
      setGyms(gymList);
    } catch (err) {
      console.error("Failed to fetch gyms:", err?.response?.data || err);
      if (err?.response?.status === 401) {
        alert("Unauthorized. Please log in again.");
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrainers();
    }
  }, [user]);

  const handleEdit = (trainer) => {
    setEditingTrainer({
      ...trainer,
      gymId:
        trainer.gymId && typeof trainer.gymId === "object"
          ? trainer.gymId._id
          : trainer.gymId?.toString() || "",
      joined: trainer.joined
        ? new Date(trainer.joined).toISOString().split("T")[0]
        : "",
    });

    fetchGyms();
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!token) {
        alert("No auth token found. Please login again.");
        return;
      }

      const trainerToSave = {
        ...editingTrainer,
        rating: isNaN(parseFloat(editingTrainer?.rating))
          ? 0
          : parseFloat(editingTrainer.rating),
        members: isNaN(parseInt(editingTrainer?.members))
          ? 0
          : parseInt(editingTrainer.members),
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = editingTrainer._id
        ? await axios.put(
            `${API_URL}/${editingTrainer._id}`,
            trainerToSave,
            config
          )
        : await axios.post(API_URL, trainerToSave, config);

      setTrainers((prev) =>
        editingTrainer._id
          ? prev.map((t) => (t._id === res.data._id ? res.data : t))
          : [...prev, res.data]
      );

      setShowModal(false);
    } catch (error) {
      console.error("Save error:", error?.response || error);
      alert("Failed to save trainer. Please check your input and login.");
    }
  };

  const handleDelete = async (trainer) => {
    console.log("handleDelete called with:", trainer);

    if (!trainer) {
      console.error("No trainer passed to handleDelete");
      return;
    }

    if (!trainer.userEmail) {
      console.error("Trainer object missing userEmail:", trainer);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert("No auth token found. Please login again.");
        return;
      }

      console.log(
        `Deleting trainer with ID: ${trainer._id} for user: ${trainer.userEmail}`
      );

      await axios.delete(`${API_URL}/${trainer._id}`, {
        data: { userEmail: trainer.userEmail },
        headers: { Authorization: `Bearer ${token}` },
      });

      setTrainers((prev) => prev.filter((t) => t._id !== trainer._id));
      console.log("Trainer deleted successfully!");
    } catch (err) {
      console.error("Failed to delete trainer:", err?.response?.data || err);
    }
  };

  const filteredTrainers =
    filter === "all"
      ? trainers.filter((t) => !t.isDeleted)
      : trainers.filter((t) => t.status === filter && !t.isDeleted);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Trainer Management</h2>
          <p className="text-muted mb-0">
            Manage trainer profiles, specialties, and assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTrainer({
              name: "",
              email: "",
              experience: "",
              rating: 0,
              specialties: [],
              members: 0,
              status: "active",
              joined: "",
              gymId: "",
            });
            fetchGyms();
            setShowModal(true);
          }}
        >
          + Add Trainer
        </Button>
      </div>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Search trainers..."
      />

      <div className="btn-group mb-4">
        <Button
          variant={filter === "all" ? "dark" : "outline-secondary"}
          onClick={() => setFilter("all")}
        >
          All Trainers
        </Button>
        <Button
          variant={filter === "active" ? "dark" : "outline-secondary"}
          onClick={() => setFilter("active")}
        >
          Active
        </Button>
        <Button
          variant={filter === "inactive" ? "dark" : "outline-secondary"}
          onClick={() => setFilter("inactive")}
        >
          Inactive
        </Button>
      </div>

      <div className="row">
        {filteredTrainers.map((trainer) => (
          <div className="col-md-4 mb-4" key={trainer._id || trainer.id}>
            <div className="card p-3 h-100 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div
                  className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center"
                  style={{ width: 40, height: 40 }}
                >
                  {trainer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <span
                  className={`badge rounded-pill ${
                    trainer.status === "active" ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {trainer.status}
                </span>
              </div>
              <h5 className="mt-3 mb-0">{trainer.name}</h5>
              <p className="text-muted small mb-1">{trainer.email}</p>

              <div className="d-flex justify-content-between small mb-2">
                <span>
                  <strong>Experience:</strong> {trainer.experience}
                </span>
                <span>
                  <strong>⭐ {trainer.rating}</strong>
                </span>
              </div>

              <div className="mb-2">
                <strong>Specialties:</strong>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {trainer.specialties.map((spec, idx) => (
                    <span key={idx} className="badge bg-light text-dark">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-muted mb-2">
                👥 {trainer.members} members
              </div>
              <div className="text-muted small mb-2">
                Joined {new Date(trainer.joined).toLocaleDateString()}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEdit(trainer)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(trainer)} // pass full object
                >
                  🗑
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTrainer?._id ? "Edit Trainer" : "Add Trainer"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Gym</Form.Label>
              <Form.Select
                value={editingTrainer?.gymId || ""}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    gymId: e.target.value,
                  }))
                }
              >
                <option value="">Select a Gym</option>
                {gyms.map((gym) => (
                  <option key={gym._id} value={gym._id}>
                    {gym.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editingTrainer?.name || ""}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={editingTrainer?.email || ""}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Experience</Form.Label>
              <Form.Control
                type="text"
                value={editingTrainer?.experience || ""}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    experience: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Rating</Form.Label>
              <Form.Control
                type="number"
                value={editingTrainer?.rating ?? 0}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    rating: isNaN(parseFloat(e.target.value))
                      ? 0
                      : parseFloat(e.target.value),
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Specialties (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={editingTrainer?.specialties?.join(", ") || ""}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    specialties: e.target.value.split(",").map((s) => s.trim()),
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Members</Form.Label>
              <Form.Control
                type="number"
                value={editingTrainer?.members || ""}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    members: parseInt(e.target.value),
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editingTrainer?.status || "active"}
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Join Date</Form.Label>
              <Form.Control
                type="date"
                value={
                  editingTrainer?.joined
                    ? new Date(editingTrainer.joined)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditingTrainer((prev) => ({
                    ...prev,
                    joined: e.target.value,
                  }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainerManagement;
