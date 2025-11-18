"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { Modal, Button, Form } from "react-bootstrap";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StaffAttendance() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    status: "Check-in",
    date: selectedDate,
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/staffmembers`);
      setStaffList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch staff members", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/staffattendance?date=${selectedDate}`
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setAttendanceList(
        data.sort((a, b) => new Date(b.time) - new Date(a.time))
      );
    } catch (err) {
      console.error("Error fetching attendance", err);
      setAttendanceList([]);
    }
  };

  const handleSaveAttendance = async () => {
    if (!formData.name || !formData.status || !formData.date) {
      return alert("Please fill all fields");
    }

    try {
      if (editId) {
        const res = await axios.put(
          `${API_URL}/api/staffattendance/${editId}`,
          formData
        );
        setAttendanceList((prev) =>
          prev.map((item) => (item._id === editId ? res.data : item))
        );
      } else {
        const res = await axios.post(
          `${API_URL}/api/staffattendance`,
          formData
        );
        setAttendanceList((prev) => [res.data, ...prev]);
      }

      setFormData({ name: "", status: "Check-in", date: selectedDate });
      setEditId(null);
      setShowModal(false);
    } catch (err) {
      console.error("Error saving attendance", err);
      alert("Failed to save attendance");
    }
  };

  const handleEdit = (record) => {
    setFormData({
      name: record.name,
      status: record.status,
      date: record.date,
    });
    setEditId(record._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${API_URL}/api/staffattendance/${id}`);
      setAttendanceList((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Error deleting record", err);
    }
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold">Staff Attendance</h2>
          <Button
            onClick={() => {
              setFormData({ name: "", status: "Check-in", date: selectedDate });
              setEditId(null);
              setShowModal(true);
            }}
          >
            + Mark Attendance
          </Button>
        </div>

        <div className="d-flex gap-2 mb-4 align-items-center">
          <input
            type="text"
            className="form-control w-auto"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="date"
            className="form-control w-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Staff Name</th>
                <th>Status</th>
                <th>Date</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No records found.
                  </td>
                </tr>
              ) : (
                attendanceList
                  .filter((item) =>
                    item.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((item) => {
                    const dt = new Date(item.time);
                    return (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>
                          <span
                            className={`badge ${
                              item.status === "Check-in"
                                ? "bg-success"
                                : "bg-warning"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.date}</td>
                        <td>{dt.toLocaleTimeString()}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-dark"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </Button>{" "}
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{editId ? "Edit" : "Mark"} Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Staff Member</Form.Label>
                <Form.Select
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                >
                  <option value="">-- Select Staff --</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff.fullname}>
                      {staff.fullname}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
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
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSaveAttendance}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </MasterLayout>
  );
}
