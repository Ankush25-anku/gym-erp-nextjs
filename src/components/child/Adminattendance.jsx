"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Table, Row, Col, Badge } from "react-bootstrap";
import { Plus } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth, useUser } from "@clerk/nextjs";

const API = process.env.NEXT_PUBLIC_API_URL;

const MemberAttendance = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [gymId, setGymId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [peopleList, setPeopleList] = useState([]);
  const [formData, setFormData] = useState({
    category: "Member",
    status: "Check-in",
    personId: "",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [members, setMembers] = useState([]);
  const [category, setCategory] = useState("Member");
  const [attendance, setAttendance] = useState([]);

  // Fetch GymId
  const fetchGymId = async (token) => {
    const role =
      user?.publicMetadata?.role || user?.unsafeMetadata?.role || "member";
    const gymUrl =
      role === "superadmin" ? `${API}/api/gyms` : `${API}/api/gyms/my`;
    const res = await axios.get(gymUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const gyms = Array.isArray(res.data) ? res.data : res.data.gyms || [];
    return gyms[0]?._id || "";
  };

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      const token = await getToken();
      const id = await fetchGymId(token);
      setGymId(id);
    };
    init();
  }, [user]);

  // Fetch Attendance for logged-in user
  // fetch attendance for logged-in user
  const fetchAttendance = async () => {
    if (!gymId || !user) return;

    try {
      const token = await getToken();
      const formattedDate = selectedDate.toISOString().split("T")[0];

      const res = await axios.get(`${API}/api/admin/attendance/my`, {
        // ✅ match backend mount
        params: { gymId, date: formattedDate },
        headers: { Authorization: `Bearer ${token}` },
      });

      setAttendance(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch attendance:", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, gymId]);

  // Fetch people list for modal
  const getPeopleList = async () => {
    if (!gymId) return;
    try {
      const token = await getToken();
      let endpoint = "";
      let setter = null;
      if (category === "Member") {
        endpoint = `${API}/api/members`;
        setter = setMembers;
      } else if (category === "Trainer") {
        endpoint = `${API}/api/admintrainers`;
        setter = setTrainers;
      } else {
        endpoint = `${API}/api/adminstaff`;
        setter = setStaff;
      }

      const res = await axios.get(endpoint, {
        params: { gymId },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!Array.isArray(res.data)) return setPeopleList([]);
      setPeopleList(res.data);
      setter(res.data);
    } catch (err) {
      console.error("❌ Error fetching people:", err);
    }
  };

  useEffect(() => {
    if (showModal && category) getPeopleList();
  }, [showModal, category]);

  // Submit attendance
  // handle submit for logged-in user
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gymId || !user) return;

    const token = await getToken();
    const date = selectedDate.toISOString().split("T")[0];

    const payload = {
      userId: user.id, // optional: backend uses token, so can omit
      category: formData.category,
      status: formData.status,
      date,
      gymId,
    };

    try {
      if (editingId) {
        await axios.put(`${API}/api/admin/attendance/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/api/admin/attendance`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      setFormData({ category: "Member", status: "Check-in", personId: "" });
      setEditingId(null);
      fetchAttendance(); // refresh
    } catch (err) {
      console.error(
        "❌ Error submitting attendance:",
        err?.response?.data || err.message
      );
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setFormData({
      category: entry.category,
      status: entry.status,
      personId: "",
    });
    setCategory(entry.category);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const token = await getToken();
    try {
      await axios.delete(`${API}/api/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAttendance();
    } catch (err) {
      console.error("❌ Failed to delete attendance:", err);
    }
  };

  const getUserName = (entry) => {
    // Decide which array to look in
    const people =
      entry.category === "Trainer"
        ? trainers
        : entry.category === "Staff"
        ? staff
        : members;

    // If array is empty, show placeholder
    if (!people || people.length === 0) return "Loading...";

    // Normalize IDs for comparison
    const userIdStr = entry.userId?.toString();

    // Find the person
    const match = people.find((p) => p._id?.toString() === userIdStr);

    // Return proper name or fallback
    if (!match) return "Unknown";

    // Members use 'fullname', Trainers/Staff might use 'name'
    if (entry.category === "Member") return match.fullname || "Unknown";
    return match.name || "Unknown";
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Attendance</h4>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Attendance
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            className="form-control"
          />
        </Col>
      </Row>

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendance.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                No records found.
              </td>
            </tr>
          ) : (
            attendance.map((entry, idx) => (
              <tr key={entry._id}>
                <td>{idx + 1}</td>
                <td>{getUserName(entry)}</td>
                <td>{entry.category}</td>
                <td>
                  <Badge
                    bg={
                      entry.status === "Check-in"
                        ? "success"
                        : entry.status === "Check-out"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {entry.status}
                  </Badge>
                </td>
                <td>{entry.date}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(entry._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Edit Attendance" : "Add Attendance"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setCategory(cat);
                      setFormData({ ...formData, category: cat, personId: "" });
                    }}
                  >
                    <option>Member</option>
                    <option>Trainer</option>
                    <option>Staff</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Name</Form.Label>
                  <Form.Select
                    value={formData.personId}
                    onChange={(e) =>
                      setFormData({ ...formData, personId: e.target.value })
                    }
                  >
                    <option value="">-- Select --</option>
                    {peopleList.map((p, i) => (
                      <option key={`${p._id}_${i}`} value={p._id}>
                        {p.fullname || p.name || "Unnamed"}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Check-in">Check-in</option>
                <option value="Check-out">Check-out</option>
              </Form.Select>
            </Form.Group>

            <div className="d-grid">
              <Button type="submit">{editingId ? "Update" : "Submit"}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MemberAttendance;
