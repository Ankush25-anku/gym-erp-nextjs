"use client";
import React, { useEffect, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
import MasterLayout from "../../masterLayout/MasterLayout";
import { useAuth, useUser } from "@clerk/nextjs";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/roles-permissions`;

const RolesPermission = () => {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [gymId, setGymId] = useState("");

  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const fetchGymId = async (token) => {
    const role =
      user?.publicMetadata?.role || user?.unsafeMetadata?.role || "member";

    const gymUrl =
      role === "superadmin"
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/gyms`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/gyms/my`;

    const res = await axios.get(gymUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const gyms = Array.isArray(res.data) ? res.data : res.data.gyms || [];

    return gyms[0]?._id || "";
  };
  const fetchRoles = async () => {
    try {
      const token = await getToken();
      if (!isLoaded || !user || !token) return;

      const foundGymId = await fetchGymId(token);
      if (!foundGymId) return;

      setGymId(foundGymId);

      const res = await axios.get(`${API}?gymId=${foundGymId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-clerk-user-id": user.id,
        },
      });

      setRoles(res.data); // ✅ only active roles now
    } catch (err) {
      console.error(
        "❌ Failed to fetch roles:",
        err.response?.data || err.message
      );
    }
  };

  const openAddModal = () => {
    setEditingRole({
      roleName: "",
      permissions: [],
    });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole({ ...role });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!isLoaded || !user || !token || !gymId) return;

      const payload = {
        ...editingRole,
        gymId,
        isDeleted: false,
      };

      const headers = {
        Authorization: `Bearer ${token}`,
        "x-clerk-user-id": user.id,
      };

      if (editingRole._id) {
        await axios.put(`${API}/${editingRole._id}`, payload, { headers });
      } else {
        await axios.post(API, payload, { headers });
      }

      setShowModal(false);
      setEditingRole(null);
      fetchRoles();
    } catch (err) {
      alert("❌ Failed to save role.");
      console.error(err.response?.data || err.message);
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      if (!isLoaded || !user) {
        console.warn("User not loaded.");
        return;
      }

      const token = await getToken();
      if (!token) {
        console.warn("Token not found.");
        return;
      }

      await axios.delete(`${API}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-clerk-user-id": user.id,
          "Content-Type": "application/json",
        },
        data: {
          isDeleted: true,
        },
      });

      console.log("✅ Role deleted successfully:", id);
      fetchRoles();
    } catch (err) {
      console.error(
        "❌ Error deleting role:",
        err?.response?.data || err.message
      );
      alert("❌ Failed to delete role.");
    }
  };

  const handlePermissionChange = (index, value) => {
    setEditingRole((prev) => {
      const updated = [...prev.permissions];
      updated[index] = value;
      return { ...prev, permissions: updated };
    });
  };

  const addPermissionField = () => {
    setEditingRole((prev) => ({
      ...prev,
      permissions: [...(prev.permissions || []), ""],
    }));
  };

  const removePermissionField = (index) => {
    setEditingRole((prev) => {
      const updated = [...prev.permissions];
      updated.splice(index, 1);
      return { ...prev, permissions: updated };
    });
  };

  useEffect(() => {
    if (isLoaded) fetchRoles();
  }, [isLoaded]);

  return (
    <MasterLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Roles & Permissions</h2>
          <Button onClick={openAddModal}>+ Add Role</Button>
        </div>

        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Role Name</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role._id}>
                <td>{role.roleName}</td>
                <td>{role.permissions?.join(", ")}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => openEditModal(role)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(role._id)}
                  >
                    🗑
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingRole?._id ? "Edit Role" : "Add New Role"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Role Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingRole?.roleName || ""}
                  onChange={(e) =>
                    setEditingRole((prev) => ({
                      ...prev,
                      roleName: e.target.value,
                    }))
                  }
                />
              </Form.Group>

              <Form.Label>Permissions</Form.Label>
              {editingRole?.permissions?.map((perm, i) => (
                <div key={i} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={perm}
                    onChange={(e) => handlePermissionChange(i, e.target.value)}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="ms-2"
                    onClick={() => removePermissionField(i)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={addPermissionField}
              >
                + Add Permission
              </Button>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </MasterLayout>
  );
};

export default RolesPermission;
