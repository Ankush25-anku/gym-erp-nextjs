"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Form } from "react-bootstrap";
import MasterLayout from "../../masterLayout/MasterLayout";
import { useAuth, useUser } from "@clerk/nextjs";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/payments`;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [gymId, setGymId] = useState("");
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  // Fetch payments
  const fetchPayments = async () => {
    if (!user) return;

    const localGymId = localStorage.getItem("gymId");
    setGymId(localGymId);

    if (!localGymId) return;

    try {
      // ✅ Get Clerk JWT token for backend
      const token = await getToken();
      console.log("🔑 Clerk JWT (fetchPayments):", token);

      const res = await axios.get(`${API}?gymId=${localGymId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Payments fetched:", res.data);
      setPayments(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch payments:", err?.response?.data || err);
    }
  };

  const openAddModal = () => {
    setEditingPayment({
      amount: "",
      method: "",
      transactionId: "",
      status: "",
    });
    setShowModal(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment({ ...payment });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingPayment || !gymId) {
      alert("Missing payment data or Gym ID.");
      return;
    }

    try {
      const token = await getToken(); // No template needed
      console.log("🔑 Clerk JWT:", token);

      const { amount, method, transactionId, status, _id } = editingPayment;

      const paymentData = {
        gymId,
        userId: user.id, // optional, backend can attach from token
        amount: Number(amount),
        method,
        transactionId,
        status,
      };

      let res;
      if (_id) {
        // Edit existing payment
        res = await axios.put(`${API}/${_id}`, paymentData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add new payment
        res = await axios.post(API, paymentData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      console.log("✅ Payment saved:", res.data);
      setShowModal(false);
      fetchPayments();
    } catch (err) {
      console.error("❌ Save error:", err?.response?.data || err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const token = await getToken();
      console.log("🔑 Clerk JWT (handleDelete):", token);

      await axios.delete(`${API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPayments();
    } catch (err) {
      alert("Failed to delete payment.");
      console.error("❌ Delete error:", err?.response?.data || err);
    }
  };

  useEffect(() => {
    if (isLoaded && user) fetchPayments();
  }, [isLoaded, user]);

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2>Payments</h2>
        <Button onClick={openAddModal}>Add Payment</Button>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td>{payment.amount}</td>
                <td>{payment.method}</td>
                <td>{payment.transactionId}</td>
                <td>{payment.status}</td>
                <td>
                  <Button
                    variant="warning"
                    onClick={() => openEditModal(payment)}
                  >
                    Edit
                  </Button>{" "}
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(payment._id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingPayment?._id ? "Edit" : "Add"} Payment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control
                  type="number"
                  value={editingPayment?.amount}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      amount: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Method</Form.Label>
                <Form.Control
                  as="select"
                  value={editingPayment?.method}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      method: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </Form.Control>
              </Form.Group>
              <Form.Group>
                <Form.Label>Transaction ID</Form.Label>
                <Form.Control
                  type="text"
                  value={editingPayment?.transactionId}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      transactionId: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Control
                  as="select"
                  value={editingPayment?.status}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </Form.Control>
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

export default Payments;
