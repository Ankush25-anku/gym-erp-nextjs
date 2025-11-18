"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { Table, Badge, Button, Modal, Form } from "react-bootstrap";
import { Trash2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("All");
  const [gyms, setGyms] = useState([]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

const fetchGyms = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/api/gyms`, {
      headers: {
        Authorization: `Bearer ${token}`, // ✅ ADD THIS
      },
    });
    setGyms(Array.isArray(res.data) ? res.data : res.data.gyms || []);
  } catch (error) {
    console.error("Error fetching gyms:", error);
  }
};


  useEffect(() => {
    fetchUsers();
    fetchGyms();
    const storedRole = localStorage.getItem("selectedRole");
    if (storedRole) setSelectedRole(storedRole);
  }, []);

  useEffect(() => {
    const roleFilter = selectedRole.toLowerCase();
    if (roleFilter === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => user.role === roleFilter));
    }
  }, [users, selectedRole]);

  const handleEdit = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setEditingUser((prev) => ({ ...prev, profileImage: data.secure_url }));
    } catch (error) {
      console.error("Image upload error:", error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API}/api/users/${editingUser._id}`, editingUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? res.data : u)));
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to save user edits:", error);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    localStorage.setItem("selectedRole", role);
  };

  return (
    <MasterLayout>
      <div className="container py-4">
        <h3 className="mb-4">Super Admin - Users Table</h3>

        <div className="mb-3">
          <Form.Select value={selectedRole} onChange={handleRoleChange}>
            <option value="All">All</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="staff">Staff</option>
            <option value="member">Member</option>
          </Form.Select>
        </div>

        <div className="table-responsive">
          <Table bordered hover className="align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Gym</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center mx-auto"
                        style={{ width: 50, height: 50, fontWeight: "bold" }}
                      >
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </td>
                  <td>{user.name || "N/A"}</td>
                  <td>{user.email}</td>
                  <td className="text-capitalize">{user.role}</td>
                  <td>
                    <Badge bg={user.status === "active" ? "success" : "danger"}>{user.status}</Badge>
                  </td>
                  <td>{user.gymId?.name || "N/A"}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(user)} className="me-2">
                      ✏️ Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(user._id)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Edit User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editingUser && (
              <form>
                <div className="mb-3 text-center">
                  {editingUser.profileImage ? (
                    <img
                      src={editingUser.profileImage}
                      alt="Profile"
                      className="rounded-circle"
                      style={{ width: 80, height: 80, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center mx-auto"
                      style={{ width: 80, height: 80, fontSize: 24 }}
                    >
                      {editingUser.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <input type="file" className="form-control mt-2" onChange={handleEditImageUpload} />
                </div>

                <div className="mb-3">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name}
                    onChange={handleEditInputChange}
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editingUser.email}
                    onChange={handleEditInputChange}
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <label>Role</label>
                  <select
                    name="role"
                    value={editingUser.role}
                    onChange={handleEditInputChange}
                    className="form-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="trainer">Trainer</option>
                    <option value="staff">Staff</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editingUser.status}
                    onChange={handleEditInputChange}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label>Gym</label>
                  <select
                    name="gymId"
                    value={editingUser.gymId?._id || ""}
                    onChange={(e) => {
                      const selectedGym = gyms.find((g) => g._id === e.target.value);
                      setEditingUser((prev) => ({ ...prev, gymId: selectedGym }));
                    }}
                    className="form-select"
                  >
                    <option value="">Select Gym</option>
                    {gyms.map((gym) => (
                      <option key={gym._id} value={gym._id}>
                        {gym.name}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </MasterLayout>
  );
};

export default SuperAdminUsers;
