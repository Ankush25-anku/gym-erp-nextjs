"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser, useAuth } from "@clerk/nextjs";
import { Button, Modal, Form } from "react-bootstrap";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/adminstaff`;

const StaffManagement = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [staffList, setStaffList] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const fetchStaff = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched staff:", res.data);
      setStaffList(res.data);
    } catch (err) {
      console.error("Failed to fetch staff:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
    }
  };

  const fetchGyms = async () => {
    try {
      const token = await getToken();
      if (!user || !token) return;

      const role =
        user?.publicMetadata?.role || user?.unsafeMetadata?.role || "member";

      const url =
        role === "superadmin"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/gyms`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/gyms/my`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gymList = Array.isArray(res.data) ? res.data : res.data.gyms || [];
      setGyms(gymList);
    } catch (err) {
      console.error("Failed to fetch gyms:", err);
    }
  };

  useEffect(() => {
    if (user) fetchStaff();
  }, [user]);

  const handleEdit = (staff) => {
    setEditingStaff({ ...staff });
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

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Prepare data exactly as backend expects
      const staffData = {
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        position: editingStaff.position,
        status:
          editingStaff.status.charAt(0).toUpperCase() +
          editingStaff.status.slice(1).toLowerCase(), // "Present" or "Absent"
        gymId: editingStaff.gymId,
      };

      const res = editingStaff._id
        ? await axios.put(`${API_URL}/${editingStaff._id}`, staffData, config)
        : await axios.post(API_URL, staffData, config);

      console.log("Saved staff:", res.data);

      setStaffList((prev) =>
        editingStaff._id
          ? prev.map((s) => (s._id === res.data._id ? res.data : s))
          : [...prev, res.data]
      );

      setShowModal(false);
    } catch (err) {
      console.error("Failed to save staff:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      alert(
        "Failed to save staff. Please check input and ensure you are logged in."
      );
    }
  };
  const handleDelete = async (id) => {
    try {
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${API_URL}/${id}`, config);
      setStaffList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Failed to delete staff:", err);
    }
  };

  const filteredStaff =
    filter === "all"
      ? staffList
      : staffList.filter(
          (s) => s.status.toLowerCase() === filter.toLowerCase()
        );

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Staff Management</h2>
          <p className="text-muted mb-0">
            Manage staff attendance, roles, and assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingStaff({
              name: "",
              email: "",
              phone: "",
              position: "",
              status: "Present",
              gymId: "",
            });
            fetchGyms();
            setShowModal(true);
          }}
        >
          + Add Staff
        </Button>
      </div>

      {/* Filter */}
      <div className="btn-group mb-4">
        <Button
          variant={filter === "all" ? "dark" : "outline-secondary"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "present" ? "dark" : "outline-secondary"}
          onClick={() => setFilter("present")}
        >
          Present
        </Button>
        <Button
          variant={filter === "absent" ? "dark" : "outline-secondary"}
          onClick={() => setFilter("absent")}
        >
          Absent
        </Button>
      </div>

      {/* Card Grid */}
      <div className="row">
        {filteredStaff.map((staff) => (
          <div className="col-md-4 mb-3" key={staff._id}>
            <div className="card p-3 shadow-sm">
              <h5>{staff.name}</h5>
              <p className="text-muted small mb-1">{staff.email}</p>
              <p className="text-muted small mb-1">{staff.phone}</p>
              <p className="text-muted small mb-1">
                Position: {staff.position}
              </p>
              <p>Status: {staff.status}</p>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEdit(staff)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(staff._id)}
                >
                  🗑
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStaff?._id ? "Edit Staff" : "Add Staff"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Gym</Form.Label>
              <Form.Select
                value={editingStaff?.gymId || ""}
                onChange={(e) =>
                  setEditingStaff((prev) => ({
                    ...prev,
                    gymId: e.target.value,
                  }))
                }
              >
                <option value="">Select Gym</option>
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
                value={editingStaff?.name || ""}
                onChange={(e) =>
                  setEditingStaff((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={editingStaff?.email || ""}
                onChange={(e) =>
                  setEditingStaff((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                value={editingStaff?.phone || ""}
                onChange={(e) =>
                  setEditingStaff((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Position</Form.Label>
              <Form.Control
                type="text"
                value={editingStaff?.position || ""}
                onChange={(e) =>
                  setEditingStaff((prev) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editingStaff?.status || "Present"}
                onChange={(e) =>
                  setEditingStaff((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </Form.Select>
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

export default StaffManagement;
