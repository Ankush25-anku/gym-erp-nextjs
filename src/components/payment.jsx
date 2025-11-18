"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Button, Modal, Form, Table, Spinner, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ✅ Membership Plans (with short descriptions)
const PLANS = [
  {
    name: "Silver",
    duration: "1 Month",
    price: 1500,
    description:
      "Perfect for beginners starting their fitness journey. Includes access to all equipment and general sessions.",
  },
  {
    name: "Gold",
    duration: "6 Months",
    price: 8500,
    description:
      "Best for regular members. Includes unlimited access, trainer guidance, and group classes for 6 months.",
  },
  {
    name: "Platinum",
    duration: "12 Months",
    price: 15000,
    description:
      "For fitness enthusiasts. Get 1 year of premium gym access, personal trainer support, and exclusive events.",
  },
];

export default function MemberPaymentsPage() {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({
    paymentMethod: "UPI",
    description: "",
  });

  // ✅ Fetch member details & their subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/member-subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setMember(res.data.clerkUser || null);
          setSubscriptions(res.data.subscriptions || []);
        }
      } catch (err) {
        console.error("❌ Error fetching subscriptions:", err);
        alert("Failed to fetch subscriptions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [getToken]);

  // ✅ Handle form change
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Handle payment/subscribe action
  // ✅ Handle payment/subscribe action
  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return alert("Please select a plan first.");

    try {
      const token = await getToken();

      // Step 1: Create Razorpay Order
      const orderRes = await axios.post(
        `${API_BASE}/api/member-subscriptions/create-order`,
        { amount: selectedPlan.price, planName: selectedPlan.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, key, amount } = orderRes.data;

      // Step 2: Open Razorpay payment popup
      const options = {
        key,
        amount,
        currency: "INR",
        name: "My Gym ERP",
        description: `${selectedPlan.name} - ${selectedPlan.duration}`,
        order_id: orderId,

        // ✅ REPLACED handler (new code)
        handler: async function (response) {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
            response;

          try {
            // Step 3: Verify and store payment
            const verifyRes = await axios.post(
              `${API_BASE}/api/member-subscriptions/verify-payment`,
              {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                planName: selectedPlan.name,
                duration: selectedPlan.duration,
                amount: selectedPlan.price,
                description: `${selectedPlan.name} Plan - ${selectedPlan.duration}`,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              alert("✅ Payment successful & verified!");
              setShowModal(false);
              setSubscriptions((prev) => [
                verifyRes.data.subscription,
                ...prev,
              ]);
              setSelectedPlan(null);
            } else {
              alert("❌ Payment verification failed!");
            }
          } catch (error) {
            console.error("❌ Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },

        prefill: {
          email: member?.email,
          name: member?.fullName || "Gym Member",
        },
        theme: {
          color: "#0D6EFD",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("❌ Razorpay payment error:", err);
      alert("Payment initialization failed. Try again.");
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  // ✅ UI
  return (
    <div className="p-4 rounded-4 bg-white shadow-sm">
      <h3 className="fw-bold text-dark mb-4">💳 My Gym Subscriptions</h3>

      {/* Member Info */}
      {member ? (
        <div className="mb-4 p-3 border rounded bg-light">
          <h5>Member: {member.fullName || "N/A"}</h5>
          <p className="mb-1">Role: {member.role || "N/A"}</p>
          <p className="mb-0 text-muted">Email: {member.email}</p>
        </div>
      ) : (
        <div className="alert alert-warning">
          Member profile not found. Please complete your profile first.
        </div>
      )}

      {/* Plans Grid */}
      <h5 className="fw-bold mb-3">Choose Your Plan</h5>
      <div className="d-flex flex-wrap gap-4 justify-content-center">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`shadow-sm border-2 ${
              selectedPlan?.name === plan.name
                ? "border-success"
                : "border-light"
            }`}
            style={{
              width: "20rem",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onClick={() => {
              setSelectedPlan(plan);
              setShowModal(true);
            }}
          >
            <Card.Body className="text-center d-flex flex-column justify-content-between">
              <div>
                <h4 className="fw-bold text-success mb-1">{plan.name}</h4>
                <p className="text-muted small mb-1">{plan.duration}</p>
                <h5 className="fw-bold mb-3">₹{plan.price}</h5>
                <p className="text-secondary small px-2">{plan.description}</p>
              </div>
              <Button variant="outline-success" className="w-100 mt-3">
                Buy {plan.name}
              </Button>
            </Card.Body>
          </Card>
        ))}
      </div>

      <hr className="my-4" />

      {/* Subscription History */}
      <h5 className="fw-bold mb-3">🧾 Subscription History</h5>
      <Table bordered hover responsive>
        <thead className="table-success text-center">
          <tr>
            <th>Date</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Transaction ID</th>
            <th>Gym Code</th>
            <th>Role</th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length > 0 ? (
            subscriptions.map((s) => (
              <tr key={s._id}>
                <td>{new Date(s.paidDate).toLocaleDateString()}</td>
                <td>{s.planName}</td>
                <td>₹{s.amount}</td>
                <td>{s.paymentMethod}</td>
                <td
                  className={
                    s.status === "Paid" ? "text-success" : "text-danger"
                  }
                >
                  {s.status}
                </td>
                <td>{s.transactionId}</td>
                <td>{s.gymCode || "N/A"}</td>
                <td>{s.role || "N/A"}</td>
                <td>
                  {s.expiryDate
                    ? new Date(s.expiryDate).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center text-muted">
                No subscriptions found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Payment Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>💰 Confirm Your Subscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlan && (
            <div className="mb-3 text-center">
              <h5 className="fw-bold text-success">{selectedPlan.name} Plan</h5>
              <p className="mb-1">{selectedPlan.duration}</p>
              <h6 className="fw-bold">Amount: ₹{selectedPlan.price}</h6>
            </div>
          )}

          {/* ✅ Razorpay Pay Button instead of dropdown */}
          <div className="text-center">
            <p className="text-muted mb-3">
              Securely complete your payment using Razorpay.
            </p>

            <Button
              variant="success"
              onClick={handlePay}
              className="w-100 fw-semibold"
              style={{
                backgroundColor: "#3399cc",
                border: "none",
                fontSize: "1rem",
                padding: "10px",
              }}
            >
              💳 Pay ₹{selectedPlan?.price} with Razorpay
            </Button>

            <p className="mt-3 small text-secondary">
              You’ll be redirected to Razorpay for secure payment.
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

