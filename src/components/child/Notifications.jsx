"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Form, Table } from "react-bootstrap";
import MasterLayout from "../../masterLayout/MasterLayout";
import { useAuth, useUser } from "@clerk/nextjs";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [gymId, setGymId] = useState("");

  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const fetchNotifications = async () => {
    try {
      const token = await getToken();

      if (!isLoaded || !user || !token) return;

      const role =
        user.publicMetadata?.role || user.unsafeMetadata?.role || "member";

      const gymUrl =
        role === "superadmin"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/gyms`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/gyms/my`;

      const gymRes = await axios.get(gymUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gyms = Array.isArray(gymRes.data)
        ? gymRes.data
        : gymRes.data.gyms || [];

      const selectedGym = gyms[0];
      const foundGymId = selectedGym?._id;

      if (!foundGymId) return;

      setGymId(foundGymId);

      const res = await axios.get(`${API}?gymId=${foundGymId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-clerk-user-id": user.id,
        },
      });

      setNotifications(res.data.filter((n) => !n.isDeleted));
    } catch (err) {
      console.error(
        "❌ Failed to fetch notifications",
        err.response?.data || err.message
      );
    }
  };

  const openAddModal = () => {
    setEditingNotification({
      type: "",
      title: "",
      message: "",
      read: false,
      createdAt: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const openEditModal = (notification) => {
    setEditingNotification({ ...notification });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!isLoaded || !user || !token) return;

      const payload = {
        ...editingNotification,
        gymId,
        userId: user.id,
        read: Boolean(editingNotification.read),
        isDeleted: false,
      };

      const headers = {
        Authorization: `Bearer ${token}`,
        "x-clerk-user-id": user.id,
      };

      if (editingNotification._id) {
        await axios.put(`${API}/${editingNotification._id}`, payload, {
          headers,
        });
      } else {
        await axios.post(API, payload, { headers });
      }

      setShowModal(false);
      fetchNotifications();
    } catch (err) {
      console.error("❌ Save failed:", err.response?.data || err.message);
      alert("Failed to save notification");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this notification?")) return;

    try {
      const token = await getToken();
      if (!isLoaded || !user || !token) return;

      await axios.put(
        `${API}/${id}`,
        {
          isDeleted: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-clerk-user-id": user.id,
          },
        }
      );

      fetchNotifications();
    } catch (err) {
      alert("Failed to delete notification");
      console.error("❌ Delete error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (isLoaded) fetchNotifications();
  }, [isLoaded]);

  return (
    <MasterLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Notifications</h2>
          <Button onClick={openAddModal}>+ Add Notification</Button>
        </div>

        <div className="table-responsive">
          <Table bordered hover>
            <thead className="table-light">
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Message</th>
                <th>Read</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n._id}>
                  <td>{n.type}</td>
                  <td>{n.title}</td>
                  <td>{n.message}</td>
                  <td>{n.read ? "Yes" : "No"}</td>
                  <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => openEditModal(n)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(n._id)}
                    >
                      🗑
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Modal Form */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingNotification?._id ? "Edit" : "Add"} Notification
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  value={editingNotification?.type || ""}
                  onChange={(e) =>
                    setEditingNotification((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={editingNotification?.title || ""}
                  onChange={(e) =>
                    setEditingNotification((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={editingNotification?.message || ""}
                  onChange={(e) =>
                    setEditingNotification((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Read</Form.Label>
                <Form.Check
                  type="checkbox"
                  checked={editingNotification?.read || false}
                  onChange={(e) =>
                    setEditingNotification((prev) => ({
                      ...prev,
                      read: e.target.checked,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Created At</Form.Label>
                <Form.Control
                  type="date"
                  value={editingNotification?.createdAt?.split("T")[0] || ""}
                  onChange={(e) =>
                    setEditingNotification((prev) => ({
                      ...prev,
                      createdAt: e.target.value,
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
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </MasterLayout>
  );
};

export default Notifications;
