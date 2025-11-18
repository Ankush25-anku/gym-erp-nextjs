"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  Table,
  Modal,
} from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AddExpenses() {
  const { getToken, isLoaded } = useAuth();

  const [formData, setFormData] = useState({
    gymCode: "",
    expenseCategory: "",
    expenseDetail: "",
    amount: "",
    paymentMode: "",
    date: "",
    transactionId: "",
    description: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ new state for categories
  const [loading, setLoading] = useState(false);
  const [gymLoading, setGymLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [editingExpense, setEditingExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  /* ✅ Fetch Gym Code Automatically */
  useEffect(() => {
    const fetchGymCode = async () => {
      try {
        if (!isLoaded) return;
        const token = await getToken();
        if (!token) return;

        const gymRes = await axios.get(`${API_BASE}/api/gym/my-gym`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const code = gymRes.data?.gym?.gymCode;
        if (code) {
          setFormData((prev) => ({ ...prev, gymCode: code }));
          fetchExpenses(code);
          fetchCategories(code); // ✅ also fetch categories when gymCode is ready
        } else {
          console.warn("⚠️ No gym code found in response");
        }
      } catch (err) {
        console.error("❌ Error fetching gym info:", err);
        setAlert({
          type: "danger",
          message: "Failed to load your gym details.",
        });
      } finally {
        setGymLoading(false);
      }
    };

    fetchGymCode();
  }, [isLoaded, getToken]);

  /* ✅ Fetch All Expenses */
  const fetchExpenses = async (gymCode) => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${API_BASE}/api/expenses?gymCode=${gymCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.error("❌ Error fetching expenses:", err);
    }
  };

  /* ✅ Fetch Expense Categories */
  const fetchCategories = async (gymCode) => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${API_BASE}/api/expenses/category?gymCode=${gymCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ✅ Create Expense */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (
      !formData.gymCode ||
      !formData.expenseCategory ||
      !formData.amount ||
      !formData.date ||
      !formData.paymentMode
    ) {
      setAlert({
        type: "danger",
        message: "⚠️ Please fill in all required fields.",
      });
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      await axios.post(`${API_BASE}/api/expenses`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAlert({
        type: "success",
        message: "✅ Expense created successfully!",
      });

      setFormData((prev) => ({
        ...prev,
        expenseCategory: "",
        expenseDetail: "",
        amount: "",
        paymentMode: "",
        date: "",
        transactionId: "",
        description: "",
      }));

      setShowAddModal(false);
      fetchExpenses(formData.gymCode);
    } catch (err) {
      console.error("❌ Error adding expense:", err);
      setAlert({
        type: "danger",
        message: "❌ Failed to add expense. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ✅ Open Edit Modal */
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  /* ✅ Update Expense */
  const handleUpdate = async () => {
    try {
      const token = await getToken();
      await axios.put(
        `${API_BASE}/api/expenses/${editingExpense._id}`,
        editingExpense,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowModal(false);
      setEditingExpense(null);
      setAlert({
        type: "success",
        message: "✅ Expense updated successfully!",
      });
      fetchExpenses(formData.gymCode);
    } catch (err) {
      console.error("❌ Error updating expense:", err);
      setAlert({ type: "danger", message: "❌ Failed to update expense." });
    }
  };

  /* ✅ Delete Expense */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlert({
        type: "success",
        message: "🗑️ Expense deleted successfully!",
      });
      fetchExpenses(formData.gymCode);
    } catch (err) {
      console.error("❌ Error deleting expense:", err);
      setAlert({ type: "danger", message: "❌ Failed to delete expense." });
    }
  };

  return (
    <div
      className="p-4 rounded-4 shadow-sm bg-white"
      style={{
        maxWidth: "1100px",
        margin: "40px auto",
        border: "1px solid #e5e7eb",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark">💸 Manage Expenses</h3>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <FaPlus className="me-2" />
          Add Expense
        </Button>
      </div>

      {alert.message && (
        <Alert variant={alert.type} className="fw-semibold">
          {alert.message}
        </Alert>
      )}

      {gymLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading gym details...</p>
        </div>
      ) : (
        <>
          {/* Expense Table */}
          <h5 className="mt-3 mb-3 text-dark fw-bold">📋 Expense List</h5>
          <div className="table-responsive">
            <Table bordered hover className="align-middle">
              <thead className="table-primary text-center">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Detail</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp._id}>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td>{exp.expenseCategory}</td>
                      <td>{exp.expenseDetail || "-"}</td>
                      <td>₹{exp.amount}</td>
                      <td>{exp.paymentMode}</td>
                      <td>{exp.description || "-"}</td>
                      <td className="text-center">
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(exp)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(exp._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-3">
                      No expenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* ✅ Add Expense Modal */}
          <Modal
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Add Expense</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Gym Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.gymCode}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Expense Category *</Form.Label>
                      <Form.Select
                        name="expenseCategory"
                        value={formData.expenseCategory}
                        onChange={handleChange}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Expense Detail</Form.Label>
                      <Form.Control
                        type="text"
                        name="expenseDetail"
                        value={formData.expenseDetail}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Amount *</Form.Label>
                      <Form.Control
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Payment Mode *</Form.Label>
                      <Form.Select
                        name="paymentMode"
                        value={formData.paymentMode}
                        onChange={handleChange}
                      >
                        <option value="">Select Mode</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online</option>
                        <option value="UPI">UPI</option>
                        <option value="Cheque">Cheque</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>

                <div className="text-end">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Expense"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* ✅ Edit Modal (same as before) */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Expense</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {editingExpense && (
                <Form>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Date *</Form.Label>
                        <Form.Control
                          type="date"
                          value={
                            editingExpense.date
                              ? new Date(editingExpense.date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              date: e.target.value,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Expense Category *</Form.Label>
                        <Form.Select
                          value={editingExpense.expenseCategory}
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              expenseCategory: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Expense Detail</Form.Label>
                        <Form.Control
                          type="text"
                          value={editingExpense.expenseDetail || ""}
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              expenseDetail: e.target.value,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Amount *</Form.Label>
                        <Form.Control
                          type="number"
                          value={editingExpense.amount}
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              amount: e.target.value,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Payment Mode *</Form.Label>
                        <Form.Select
                          value={editingExpense.paymentMode}
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              paymentMode: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Mode</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Online">Online</option>
                          <option value="UPI">UPI</option>
                          <option value="Cheque">Cheque</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editingExpense.description || ""}
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              description: e.target.value,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdate}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}
