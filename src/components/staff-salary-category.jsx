"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Spinner, Alert, Table } from "react-bootstrap";
import { useAuth } from "@clerk/nextjs";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const StaffSalaryCategory = () => {
  const { getToken, isLoaded } = useAuth();
  const [gymCode, setGymCode] = useState("");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    salaryCategory: "",
    deductableForLeaves: false,
  });
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  // ✅ Fetch gym code for logged-in user
  useEffect(() => {
    const fetchGymCode = async () => {
      try {
        if (!isLoaded) return;
        const token = await getToken();

        const res = await axios.get(`${API_BASE}/api/gym/my-gym`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const code = res.data?.gym?.gymCode;
        if (code) {
          setGymCode(code);
          fetchCategories(code);
        }
      } catch (err) {
        console.error("❌ Error fetching gym info:", err);
        setAlert({
          type: "danger",
          message: "Failed to load gym information.",
        });
      }
    };
    fetchGymCode();
  }, [isLoaded, getToken]);

  // ✅ Fetch salary categories for this gym
  const fetchCategories = async (code) => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category?gymCode=${code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories(res.data || []);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setAlert({
        type: "danger",
        message: "Failed to fetch salary categories.",
      });
    }
  };

  // ✅ Create category
  const handleSave = async () => {
    if (!formData.salaryCategory.trim()) {
      setAlert({ type: "danger", message: "Please enter a category name." });
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.post(
        `${API_BASE}/api/staff-salary-category`,
        { ...formData, gymCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories((prev) => [...prev, res.data]);
      setShowModal(false);
      setFormData({ salaryCategory: "", deductableForLeaves: false });
      setAlert({ type: "success", message: "✅ Category created successfully!" });
    } catch (error) {
      console.error("❌ Error saving category:", error);
      setAlert({
        type: "danger",
        message: "Failed to create category. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Open edit modal
  const handleEditClick = (category) => {
    setEditCategory(category);
    setShowEditModal(true);
  };

  // ✅ Update category
  const handleUpdate = async () => {
    if (!editCategory.salaryCategory.trim()) {
      setAlert({ type: "danger", message: "Please enter a category name." });
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.put(
        `${API_BASE}/api/staff-salary-category/${editCategory._id}`,
        {
          salaryCategory: editCategory.salaryCategory,
          deductableForLeaves: editCategory.deductableForLeaves,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === editCategory._id ? res.data : cat
        )
      );

      setShowEditModal(false);
      setAlert({ type: "success", message: "✅ Category updated successfully!" });
    } catch (error) {
      console.error("❌ Error updating category:", error);
      setAlert({
        type: "danger",
        message: "Failed to update category. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const token = await getToken();
      await axios.delete(`${API_BASE}/api/staff-salary-category/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      setAlert({ type: "success", message: "🗑️ Category deleted successfully!" });
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      setAlert({
        type: "danger",
        message: "Failed to delete category. Please try again.",
      });
    }
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Staff Salary Categories</h4>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> New Category
        </Button>
      </div>

      {/* Alerts */}
      {alert.message && (
        <Alert variant={alert.type} className="fw-semibold">
          {alert.message}
        </Alert>
      )}

      {/* Table */}
      {!gymCode ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading gym information...</p>
        </div>
      ) : (
        <Table bordered hover responsive className="align-middle text-center">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Salary Category</th>
              <th>Deductable for Leaves</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat, index) => (
                <tr key={cat._id}>
                  <td>{index + 1}</td>
                  <td>{cat.salaryCategory}</td>
                  <td>{cat.deductableForLeaves ? "true" : "false"}</td>
                  <td className="d-flex justify-content-center gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleEditClick(cat)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(cat._id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-muted py-3">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* ➕ Add Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Salary Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Salary Category</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter category name"
                value={formData.salaryCategory}
                onChange={(e) =>
                  setFormData({ ...formData, salaryCategory: e.target.value })
                }
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Deductable for Leaves"
              checked={formData.deductableForLeaves}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deductableForLeaves: e.target.checked,
                })
              }
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✏️ Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Salary Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Salary Category</Form.Label>
              <Form.Control
                type="text"
                value={editCategory?.salaryCategory || ""}
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    salaryCategory: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Deductable for Leaves"
              checked={editCategory?.deductableForLeaves || false}
              onChange={(e) =>
                setEditCategory({
                  ...editCategory,
                  deductableForLeaves: e.target.checked,
                })
              }
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffSalaryCategory;
