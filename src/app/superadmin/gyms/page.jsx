"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { Button, Modal, Form } from "react-bootstrap";
import { BsTrash, BsPencilSquare } from "react-icons/bs";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function GymCreateForm() {
  const router = useRouter();
  const [gyms, setGyms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingGymId, setEditingGymId] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    subscriptionPlan: "",
    status: "Active",
  });

  // ✅ Superadmin role check
  useEffect(() => {
    const user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user"))
        : null;
    const role = localStorage.getItem("userRole");

    if (!user || role !== "superadmin") {
      router.replace("/login"); // or a 403 page like "/unauthorized"
    }
  }, []);

  const handleShow = () => {
    setEditMode(false);
    setFormData({
      name: "",
      email: userEmail,
      phone: "",
      address: "",
      subscriptionPlan: "",
      status: "Active",
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      name: "",
      email: userEmail, // ✅ fixed here
      phone: "",
      address: "",
      subscriptionPlan: "",
      status: "Active",
    });
    setMessage("");
    setEditMode(false);
    setEditingGymId(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editMode) {
        const res = await axios.put(
          `${API_BASE}/api/gyms/${editingGymId}`,
          formData
        );
        setGyms((prev) =>
          prev.map((gym) => (gym._id === editingGymId ? res.data : gym))
        );
        setMessage("✅ Gym updated successfully!");
      } else {
        const res = await axios.post(
          `${API_BASE}/api/gyms/create`,
          { ...formData, email: userEmail },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGyms((prev) => [...prev, res.data]);
        setMessage("✅ Gym created successfully!");
      }

      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      console.error("❌ Gym save failed:", err);
      setMessage("❌ Failed to save gym.");
    }
  };

  const handleEdit = (gym) => {
    setEditMode(true);
    setEditingGymId(gym._id);
    setFormData({
      name: gym.name,
      email: gym.email,
      phone: gym.phone,
      address: gym.address,
      subscriptionPlan: gym.subscriptionPlan,
      status: gym.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (gymId) => {
    if (!confirm("Are you sure you want to delete this gym?")) return;
    try {
      await axios.delete(`${API_BASE}/api/gyms/${gymId}`);
      setGyms((prev) => prev.filter((gym) => gym._id !== gymId));
    } catch (err) {
      console.error("❌ Failed to delete gym:", err);
    }
  };

  const fetchGyms = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole"); // ✅ Get role from localStorage

      const res = await axios.get(`${API_BASE}/api/gyms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGyms(Array.isArray(res.data) ? res.data : res.data.gyms || []);
    } catch (err) {
      console.error("Failed to fetch gyms", err);
    }
  };

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserEmail(res.data.email);
      } catch (err) {
        console.error("❌ Failed to fetch user info:", err);
      }
    };

    fetchUserEmail();
    fetchGyms();
  }, []);

  useEffect(() => {
    if (!editMode) {
      setFormData((prev) => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Gyms</h2>
          <Button variant="primary" onClick={handleShow}>
            + Add Gym
          </Button>
        </div>

        <Modal show={showModal} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Edit Gym" : "Add New Gym"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {message && <div className="alert alert-info">{message}</div>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>GYM Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Subscription Plan</Form.Label>
                <Form.Select
                  name="subscriptionPlan"
                  value={formData.subscriptionPlan}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Plan</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Form.Select>
              </Form.Group>

              <Button variant="success" type="submit" className="w-100">
                {editMode ? "Update Gym" : "Save Gym"}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        <div className="table-responsive mt-4">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>GYM Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Subscription Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gyms.map((gym) => (
                <tr key={gym._id}>
                  <td>{gym.name}</td>
                  <td>{gym.email}</td>
                  <td>{gym.phone}</td>
                  <td>{gym.address}</td>
                  <td>{gym.subscriptionPlan}</td>
                  <td>{gym.status}</td>
                  <td>
                    <Button
                      variant="warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(gym)}
                    >
                      <BsPencilSquare size={16} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(gym._id)}
                    >
                      <BsTrash size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MasterLayout>
  );
}
