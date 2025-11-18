"use client";

import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth, useUser } from "@clerk/nextjs";
import { Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

// Base backend URL
// const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/members`;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const JWT_TEMPLATE = "backend"; // <- make sure this exists in Clerk dashboard

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return "";
  }
};

const MemberManagement = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const getFreshToken = async () => {
    if (!isLoaded || !isSignedIn) return null;
    try {
      const token = await getToken({ template: JWT_TEMPLATE });
      if (!token) throw new Error("Failed to fetch token");
      return token;
    } catch (err) {
      console.error("❌ Error fetching token:", err);
      return null;
    }
  };

  const [authToken, setAuthToken] = useState("");
  const [members, setMembers] = useState([]);
  const [gyms, setGyms] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] =
    useState(null);
  const [paidMembers, setPaidMembers] = useState({});

  const [newMember, setNewMember] = useState({
    fullname: "",
    email: "",
    phone: "",
    plan: "",
    address: "",
    expires: null,
    joined: null,
    status: "active",
    gymId: "",
    emergency: { name: "", phoneno: "", relation: "" },
    health: { height: "", weight: "", bloodType: "", medicalConditions: "" },
    image: "",
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = await getToken();

        const { data } = await axios.get(`${API}/api/member-payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const paidMap = {};
        data.forEach((payment) => {
          paidMap[payment.memberId] = payment.amount;
        });

        setPaidMembers(paidMap);
      } catch (error) {
        console.error("Failed to fetch payment data:", error);
      }
    };

    fetchPayments();
  }, []);

  useEffect(() => {
    const boot = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) return;
      const token = await getToken({ template: JWT_TEMPLATE });
      setAuthToken(token || "");
    };
    boot();
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!authToken) return;
    fetchMembers();
    fetchGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const fetchMembers = async () => {
    const token = await getFreshToken();
    if (!token) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(Array.isArray(res.data) ? res.data : res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch members", err?.response?.data || err);
    }
  };

  const fetchGyms = async () => {
    try {
      // ✅ Get the JWT token from Clerk
      const token = await getFreshToken();
      if (!token) {
        console.warn("No auth token available, skipping fetchGyms.");
        return;
      }

      // Determine URL based on user role
      const role =
        user?.publicMetadata?.role || user?.unsafeMetadata?.role || "member";
      const url =
        role === "superadmin" ? `${API}/api/gyms` : `${API}/api/gyms/my`;

      // Fetch gyms from backend with Authorization header
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }, // matches middleware
      });

      // Normalize data
      const data = Array.isArray(res.data) ? res.data : res.data.gyms || [];
      setGyms(data);
    } catch (err) {
      // Handle errors gracefully
      if (err.response) {
        console.error("Failed to fetch gyms:", err.response.data);
      } else {
        console.error("Failed to fetch gyms:", err);
      }
    }
  };

  const handleImageChange = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file);
      if (isEdit) {
        setEditingMember((prev) => ({ ...prev, image: url }));
      } else {
        setNewMember((prev) => ({ ...prev, image: url }));
      }
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
    }
  };

  const handleBasicDetailsClick = (member) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    const setFn = isEdit ? setEditingMember : setNewMember;

    if (["emergencyName", "phoneno", "relation"].includes(name)) {
      setFn((prev) => ({
        ...prev,
        emergency: {
          ...prev.emergency,
          [name === "emergencyName" ? "name" : name]: value,
        },
      }));
    } else if (
      ["height", "weight", "bloodType", "medicalConditions"].includes(name)
    ) {
      setFn((prev) => ({
        ...prev,
        health: { ...prev.health, [name]: value },
      }));
    } else if (name === "plan") {
      setFn((prev) => {
        const newExpiry = calculateExpiryDate(prev.joined, value);
        return { ...prev, plan: value, expires: newExpiry };
      });
    } else {
      setFn((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddMember = async () => {
    const token = await getFreshToken();
    if (!token) return;

    const initials = newMember.fullname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    const memberData = {
      ...newMember,
      initials,
      joined: newMember.joined ? newMember.joined.toISOString() : "",
      expires: newMember.expires ? newMember.expires.toISOString() : "",
      userId: user?.id, // ✅ Clerk user ID (matches backend filter)
      userEmail:
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        "",
      isDeleted: false,
    };

    try {
      const response = await axios.post(API_URL, memberData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMembers((prev) => [...prev, response.data]);
      setShowAddModal(false);
      setNewMember({
        fullname: "",
        email: "",
        phone: "",
        plan: "",
        address: "",
        joined: null,
        expires: null,
        status: "active",
        gymId: "",
        emergency: { name: "", phoneno: "", relation: "" },
        health: {
          height: "",
          weight: "",
          bloodType: "",
          medicalConditions: "",
        },
        image: "",
      });
    } catch (err) {
      console.error("Error adding member:", err?.response?.data || err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    const token = await getFreshToken();
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        data: { isDeleted: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Failed to delete member:", err?.response?.data || err);
      alert("Failed to delete member.");
    }
  };

  const handleEditClick = (member) => {
    setEditingMember({
      ...member,
      gymId: member.gymId?._id || member.gymId || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const token = await getFreshToken();
    if (!token || !editingMember) return;

    try {
      const res = await axios.put(
        `${API_URL}/${editingMember._id}`,
        editingMember,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the members array
      setMembers((prev) =>
        prev.map((m) => (m._id === res.data._id ? res.data : m))
      );

      // Update selectedMember so Plan tab shows latest info
      setSelectedMember(res.data);

      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update member:", err?.response?.data || err);
    }
  };

  // Calculate expiry date based on joining date and plan
  const calculateExpiryDate = (joinDate, plan) => {
    if (!joinDate || !plan) return null;
    const expiry = new Date(joinDate);
    if (plan === "Basic") {
      expiry.setMonth(expiry.getMonth() + 1);
    } else if (plan === "Premium") {
      expiry.setMonth(expiry.getMonth() + 6);
    } else if (plan === "VIP") {
      expiry.setFullYear(expiry.getFullYear() + 1);
    }
    return expiry;
  };

  // Calculate remaining days, optionally using a manually set expiry date
  const calculateRemainingDays = (joinDate, plan, expires = null) => {
    const expiryDate = expires
      ? new Date(expires)
      : calculateExpiryDate(joinDate, plan);
    if (!expiryDate) return "N/A";
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days left` : "Expired";
  };

  const filterMembers = (members, filter) => {
    const today = new Date();

    switch (filter) {
      case "Active":
        return members.filter((m) => new Date(m.expiryDate) > today);
      case "Expired":
        return members.filter((m) => new Date(m.expiryDate) < today);
      case "Expiring This Week":
        return members.filter((m) => {
          const expiry = new Date(m.expiryDate);
          const weekLater = new Date();
          weekLater.setDate(today.getDate() + 7);
          return expiry >= today && expiry <= weekLater;
        });
      case "Expiring This Month":
        return members.filter((m) => {
          const expiry = new Date(m.expiryDate);
          const nextMonth = new Date();
          nextMonth.setMonth(today.getMonth() + 1);
          return expiry >= today && expiry <= nextMonth;
        });
      default:
        return members;
    }
  };
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleBuyPlan = async (member) => {
    const token = await getFreshToken();
    if (!token) return;

    let amount;
    if (member.plan === "Basic") amount = 1000 * 100;
    else if (member.plan === "Premium") amount = 6000 * 100;
    else if (member.plan === "VIP") amount = 12000 * 100;
    else return alert("Invalid plan selected for this member.");

    if (!window.Razorpay) return alert("Razorpay not loaded.");

    try {
      const { data: order } = await axios.post(
        `${API}/api/razorpay/create-order`,
        { amount }
      );

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Gym Plan Purchase",
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyRes = await axios.post(`${API}/api/razorpay/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifyRes.data.success) {
              return alert(
                "Payment verification failed. Please contact support."
              );
            }

            console.log("Member ID being sent:", member._id);

            // ✅ Refresh token AFTER Razorpay checkout
            const freshToken = await getFreshToken();
            if (!freshToken) {
              return alert("Session expired. Please log in again.");
            }

            // Save payment if verified
            const paymentData = {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              memberId: member._id,
              memberName: member.fullname,
              amount: order.amount / 100,
              date: new Date(),
              method: "Razorpay",
            };

            await axios.post(`${API}/api/member-payments`, paymentData, {
              headers: { Authorization: `Bearer ${freshToken}` },
            });

            setPaidMembers((prev) => ({
              ...prev,
              [member._id]: paymentData.amount,
            }));

            alert(`Payment of ₹${paymentData.amount} recorded successfully!`);
          } catch (dbError) {
            console.error("Error saving payment:", dbError);
            alert(
              "Payment succeeded but verification/db save failed. Please contact support."
            );
          }
        },

        prefill: {
          name: member.fullname,
          email: member.email,
          contact: member.phone,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment failed. Please try again.");
    }
  };

  // -----------------------------
  // Init
  // -----------------------------
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMembers();
      fetchGyms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);
  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h3 className="m-0">Member Management</h3>

        <div className="d-flex gap-2 flex-wrap">
          {[
            "All",
            "Active",
            "Expired",
            "Expiring This Week",
            "Expiring This Month",
          ].map((filter) => (
            <button
              key={filter}
              className={`btn ${
                activeFilter === filter ? "btn-dark" : "btn-outline-dark"
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
          <Button variant="dark" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add Member
          </Button>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {filterMembers(members).map((member) => {
          const isPlanExpired =
            member.planExpiry && new Date(member.planExpiry) < new Date();

          return (
            <div
              className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4"
              key={member._id || member.id}
            >
              <div className="card h-100 shadow-sm p-3 d-flex flex-column">
                {/* Header */}
                <div className="d-flex align-items-start justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-3">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt="Profile"
                        className="rounded-circle object-fit-cover"
                        style={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <div
                        className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center fw-bold"
                        style={{ width: 48, height: 48 }}
                      >
                        {member.initials || "NA"}
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-bold text-wrap">
                        {member.fullname || "No Name"}
                      </h6>
                      <small className="text-muted text-wrap">
                        {member.email}
                      </small>
                    </div>
                  </div>
                  <span
                    className={`badge rounded-pill px-3 py-2 ${
                      new Date(member.expires) < new Date() &&
                      !paidMembers[member._id]
                        ? "bg-danger"
                        : member.status === "active"
                        ? "bg-success"
                        : "bg-warning text-dark"
                    }`}
                  >
                    {new Date(member.expires) < new Date() &&
                    !paidMembers[member._id]
                      ? "Expired"
                      : member.status.charAt(0).toUpperCase() +
                        member.status.slice(1)}
                  </span>
                </div>

                {/* Details */}
                <div className="mb-3 small text-wrap">
                  <p className="mb-1">
                    <strong>Plan:</strong> {member.plan || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Phone:</strong> {member.phone || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Address:</strong> {member.address || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Emergency:</strong>{" "}
                    {member.emergency?.name || "N/A"},{" "}
                    {member.emergency?.phoneno || "-"} (
                    {member.emergency?.relation || "-"})
                  </p>
                  <p className="mb-1">
                    <strong>Health:</strong> {member.health?.height || "-"}cm,{" "}
                    {member.health?.weight || "-"}kg,{" "}
                    {member.health?.bloodType || "N/A"}
                    <br />
                    <em>{member.health?.medicalConditions || "None"}</em>
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-auto">
                  <div className="d-flex justify-content-between mb-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleEditClick(member)}
                    >
                      <Edit size={16} /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(member._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <Button
                    variant="info"
                    size="sm"
                    className="w-100"
                    onClick={() => handleBasicDetailsClick(member)}
                  >
                    Basic Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expired Plan Pay Option
                {isPlanExpired && (
                  <div className="mt-3">
                    <div className="alert alert-danger p-2 mb-2" role="alert">
                      Membership expired on{" "}
                      <strong>
                        {new Date(member.planExpiry).toLocaleDateString()}
                      </strong>
                    </div>
                    <Button
                      variant="success"
                      className="w-100"
                      onClick={() => handlePayNow(member)}
                    >
                      Pay Now
                    </Button>
                  </div>
                )} */}

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Fullname</Form.Label>
              <Form.Control
                name="fullname"
                value={newMember.fullname}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Profile Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                value={newMember.email}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phone"
                value={newMember.phone}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Plan</Form.Label>
              <Form.Select
                name="plan"
                value={newMember.plan}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
                <option value="VIP">VIP</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Select Gym</Form.Label>
              <Form.Select
                name="gymId"
                value={newMember.gymId}
                onChange={(e) =>
                  setNewMember((prev) => ({ ...prev, gymId: e.target.value }))
                }
              >
                <option value="">Select Gym</option>

                {Array.isArray(gyms) &&
                  gyms.map((gym) => (
                    <option key={gym._id} value={gym._id}>
                      {gym.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Address</Form.Label>
              <Form.Control
                name="address"
                value={newMember.address}
                onChange={handleInputChange}
              />

              <Form.Group className="mb-3">
                <Form.Label>Joining Date</Form.Label>
                <DatePicker
                  selected={newMember.joined}
                  onChange={(date) =>
                    setNewMember((prev) => ({
                      ...prev,
                      joined: date,
                      expires: calculateExpiryDate(date, prev.plan),
                    }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Select joining date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </Form.Group>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <DatePicker
                selected={newMember.expires}
                onChange={(date) =>
                  setNewMember((prev) => ({ ...prev, expires: date }))
                }
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="Select expiry date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </Form.Group>

            <hr />
            <h6>Emergency Contact</h6>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                name="emergencyName"
                value={newMember.emergency.name}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phoneno"
                value={newMember.emergency.phoneno}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Relation</Form.Label>
              <Form.Control
                name="relation"
                value={newMember.emergency.relation}
                onChange={handleInputChange}
              />
            </Form.Group>

            <hr />
            <h6>Health Information</h6>
            <Form.Group>
              <Form.Label>Height (cm)</Form.Label>
              <Form.Control
                name="height"
                value={newMember.health.height}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control
                name="weight"
                value={newMember.health.weight}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Blood Type</Form.Label>
              <Form.Control
                name="bloodType"
                value={newMember.health.bloodType}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Medical Conditions</Form.Label>
              <Form.Control
                name="medicalConditions"
                value={newMember.health.medicalConditions}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddMember}>
            Add Member
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingMember && (
            <Form>
              <Form.Group>
                <Form.Label>Fullname</Form.Label>
                <Form.Control
                  name="fullname"
                  value={editingMember.fullname}
                  onChange={(e) => handleInputChange(e, true)}
                />
                <Form.Group>
                  <Form.Label>Profile Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                  />
                  {editingMember?.image && (
                    <img
                      src={editingMember.image}
                      alt="Preview"
                      className="mt-2"
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </Form.Group>
              </Form.Group>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  name="email"
                  value={editingMember.email}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  name="phone"
                  value={editingMember.phone}
                  onChange={(e) => handleInputChange(e, true)}
                />
                <Form.Group className="mb-3">
                  <Form.Label>Joining Date</Form.Label>
                  <DatePicker
                    selected={
                      editingMember.joined
                        ? new Date(editingMember.joined)
                        : null
                    }
                    onChange={(date) =>
                      setEditingMember((prev) => ({
                        ...prev,
                        joined: date,
                        expires: calculateExpiryDate(date, prev.plan),
                      }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    placeholderText="Select joining date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <DatePicker
                    selected={
                      editingMember.expires
                        ? new Date(editingMember.expires)
                        : null
                    }
                    onChange={(date) =>
                      setEditingMember((prev) => ({ ...prev, expires: date }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    placeholderText="Select expiry date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Form.Group>
              </Form.Group>
              <Form.Group>
                <Form.Label>Plan</Form.Label>
                <Form.Select
                  name="plan"
                  value={editingMember.plan}
                  onChange={(e) => handleInputChange(e, true)}
                >
                  <option value="">Select</option>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Select Gym</Form.Label>
                <Form.Select
                  name="gymId"
                  value={editingMember?.gymId || ""}
                  onChange={(e) =>
                    setEditingMember((prev) => ({
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

              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control
                  name="address"
                  value={editingMember.address}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>

              <hr />
              <h6>Emergency Contact</h6>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  name="emergencyName"
                  value={editingMember.emergency.name}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  name="phoneno"
                  value={editingMember.emergency.phoneno}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Relation</Form.Label>
                <Form.Control
                  name="relation"
                  value={editingMember.emergency.relation}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>

              <hr />
              <h6>Health Info</h6>
              <Form.Group>
                <Form.Label>Height</Form.Label>
                <Form.Control
                  name="height"
                  value={editingMember.health.height}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Weight</Form.Label>
                <Form.Control
                  name="weight"
                  value={editingMember.health.weight}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Blood Type</Form.Label>
                <Form.Control
                  name="bloodType"
                  value={editingMember.health.bloodType}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Medical Conditions</Form.Label>
                <Form.Control
                  name="medicalConditions"
                  value={editingMember.health.medicalConditions}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </Form.Group>
            </Form>
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

      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold">
            Member Basic Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedMember && (
            <>
              {/* Tabs */}
              <div className="d-flex justify-content-between gap-2 mb-4">
                <Button
                  variant={activeTab === "profile" ? "dark" : "outline-dark"}
                  onClick={() => setActiveTab("profile")}
                  className="w-100"
                  size="sm"
                >
                  Profile
                </Button>
                <Button
                  variant={activeTab === "plan" ? "dark" : "outline-dark"}
                  onClick={() => setActiveTab("plan")}
                  className="w-100"
                  size="sm"
                >
                  Plan
                </Button>
                <Button
                  variant={activeTab === "payment" ? "dark" : "outline-dark"}
                  onClick={() => setActiveTab("payment")}
                  className="w-100"
                  size="sm"
                >
                  Payment
                </Button>
              </div>

              {/* Image + Content Row */}
              <Row className="align-items-center text-center text-md-start">
                <Col xs={12} md={4} className="mb-3 mb-md-0">
                  {selectedMember.image ? (
                    <img
                      src={selectedMember.image}
                      alt="Profile"
                      className="img-fluid rounded-circle"
                      style={{ width: 100, height: 100, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center mx-auto fw-bold"
                      style={{ width: 100, height: 100, fontSize: "1.5rem" }}
                    >
                      {selectedMember.initials || "NA"}
                    </div>
                  )}
                </Col>

                <Col xs={12} md={8}>
                  {activeTab === "profile" && (
                    <>
                      <p className="mb-1">
                        <strong>Name:</strong> {selectedMember.fullname}
                      </p>
                      <p className="mb-1">
                        <strong>Email:</strong> {selectedMember.email}
                      </p>
                      <p className="mb-1">
                        <strong>Phone:</strong> {selectedMember.phone}
                      </p>
                    </>
                  )}
                  {activeTab === "plan" && selectedMember && (
                    <>
                      <p className="mb-1">
                        <strong>Plan:</strong> {selectedMember.plan || "N/A"}
                      </p>
                      <p className="mb-1">
                        <strong>Plan Price:</strong>{" "}
                        {selectedMember.plan === "Basic"
                          ? "₹1000"
                          : selectedMember.plan === "Premium"
                          ? "₹6000"
                          : selectedMember.plan === "VIP"
                          ? "₹12000"
                          : "N/A"}
                      </p>

                      <p className="mb-1">
                        <strong>Joined:</strong>{" "}
                        {selectedMember.joined
                          ? new Date(selectedMember.joined).toLocaleDateString(
                              "en-GB"
                            )
                          : "N/A"}
                      </p>

                      <p className="mb-1">
                        <strong>Expires:</strong>{" "}
                        {selectedMember.expires
                          ? new Date(selectedMember.expires).toLocaleDateString(
                              "en-GB"
                            )
                          : selectedMember.joined && selectedMember.plan
                          ? new Date(
                              calculateExpiryDate(
                                selectedMember.joined,
                                selectedMember.plan
                              )
                            ).toLocaleDateString("en-GB")
                          : "N/A"}
                      </p>

                      <p className="mb-1 text-success fw-semibold">
                        <strong>Remaining:</strong>{" "}
                        {calculateRemainingDays(
                          selectedMember.joined,
                          selectedMember.plan,
                          selectedMember.expires
                        )}
                      </p>
                    </>
                  )}

                  {activeTab === "payment" && (
                    <>
                      <p className="mb-1">
                        <strong>Payment Status:</strong>{" "}
                        <span
                          className={`badge ${
                            paidMembers[selectedMember._id]
                              ? "bg-success"
                              : "bg-warning"
                          }`}
                        >
                          {paidMembers[selectedMember._id]
                            ? "Payment Done"
                            : "Payment Pending"}
                        </span>
                      </p>

                      <p className="mb-1">
                        <strong>Subscription Status:</strong>{" "}
                        <span
                          className={`badge ${
                            paidMembers[selectedMember._id]
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {paidMembers[selectedMember._id]
                            ? "Active"
                            : "Expired"}
                        </span>
                      </p>
                    </>
                  )}
                </Col>
              </Row>
              {selectedMember && (
                <div className="mt-4 text-center">
                  {/* Only show expired alert if not paid */}
                  {new Date(selectedMember.expires) < new Date() &&
                    !paidMembers[selectedMember._id] && (
                      <Alert variant="danger">
                        This member’s plan expired on{" "}
                        <strong>
                          {new Date(selectedMember.expires).toLocaleDateString(
                            "en-GB"
                          )}
                        </strong>
                      </Alert>
                    )}

                  {paidMembers[selectedMember._id] ? (
                    <Button variant="success" disabled>
                      ✅ ₹{paidMembers[selectedMember._id]} Paid
                    </Button>
                  ) : (
                    new Date(selectedMember.expires) < new Date() && (
                      <Button onClick={() => handleBuyPlan(selectedMember)}>
                        Buy Plan
                      </Button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDetailsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MemberManagement;
