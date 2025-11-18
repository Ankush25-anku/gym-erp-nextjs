"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Button, Table, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ExpenseCategory() {
  const { getToken, isLoaded } = useAuth();
  const [gymCode, setGymCode] = useState("");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  // ✅ Fetch Gym Code Automatically
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
        console.error("❌ Error fetching gym:", err);
        setAlert({ type: "danger", message: "Failed to load gym info." });
      }
    };
    fetchGymCode();
  }, [isLoaded, getToken]);

  // ✅ Fetch Categories
  const fetchCategories = async (gymCode) => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${API_BASE}/api/expenses/category?gymCode=${gymCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  };

  // ✅ Create New Category
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      setAlert({ type: "danger", message: "Please enter a category name." });
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE}/api/expenses/category`,
        { gymCode, name: newCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories((prev) => [...prev, res.data.category]);
      setAlert({
        type: "success",
        message: "✅ Category created successfully!",
      });
      setNewCategory("");
      setShowModal(false);
    } catch (err) {
      console.error("❌ Error creating category:", err);
      setAlert({
        type: "danger",
        message: "Failed to create category. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Open Edit Modal
  const handleEditCategory = (cat) => {
    setEditCategory(cat);
    setShowEditModal(true);
  };

  // ✅ Update Category
  const handleUpdateCategory = async () => {
    if (!editCategory?.name.trim()) {
      setAlert({ type: "danger", message: "Please enter a category name." });
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE}/api/expenses/category/${editCategory._id}`,
        { name: editCategory.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === editCategory._id ? res.data.updatedCategory : cat
        )
      );

      setAlert({
        type: "success",
        message: "✅ Category updated successfully!",
      });
      setShowEditModal(false);
      setEditCategory(null);
    } catch (err) {
      console.error("❌ Error updating category:", err);
      setAlert({
        type: "danger",
        message: "Failed to update category. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const token = await getToken();
      await axios.delete(`${API_BASE}/api/expenses/category/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      setAlert({
        type: "success",
        message: "🗑️ Category deleted successfully!",
      });
    } catch (err) {
      console.error("❌ Error deleting category:", err);
      setAlert({
        type: "danger",
        message: "Failed to delete category. Please try again.",
      });
    }
  };

  return (
    <div
      className="p-4 rounded-4 shadow-sm bg-white"
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        border: "1px solid #e5e7eb",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark">📂 Expense Categories</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> New Category
        </Button>
      </div>

      {alert.message && (
        <Alert variant={alert.type} className="fw-semibold">
          {alert.message}
        </Alert>
      )}

      {!gymCode ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading gym info...</p>
        </div>
      ) : (
        <>
          {/* Category Table */}
          <h5 className="mt-3 mb-3 text-dark fw-bold">📋 Category List</h5>
          <div className="table-responsive">
            <Table bordered hover className="align-middle text-center">
              <thead className="table-primary">
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <tr key={cat._id}>
                      <td>{index + 1}</td>
                      <td>{cat.name}</td>
                      <td className="d-flex justify-content-center gap-2">
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditCategory(cat)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteCategory(cat._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-muted py-3">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {/* ✅ Modal for New Category */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Expense Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Category Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateCategory}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Modal for Editing Category */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Expense Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Category Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter new name"
                value={editCategory?.name || ""}
                onChange={(e) =>
                  setEditCategory({ ...editCategory, name: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateCategory}
            disabled={loading}
          >
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
