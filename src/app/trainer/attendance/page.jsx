"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { Dropdown, Modal, Button, Form } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const trainerName = "Ankush Shetty"; // Replace with real auth if needed

export default function AttendanceView() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [attendanceType, setAttendanceType] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("attendanceType") || "Trainer";
    }
    return "Trainer";
  });
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState([]);

  const [formData, setFormData] = useState({
    name: trainerName,
    status: "Check-in",
    date: new Date().toISOString().split("T")[0],
    category: "Trainer",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // useEffect(() => {
  //   fetchMembers();
  // }, []);

 useEffect(() => {
  fetchMembersAndAttendance();
}, [attendanceType]);

const fetchMembersAndAttendance = async () => {
  try {
    const res = await axios.get(`${API}/api/members`);
    const membersData = res.data || [];
    setMembers(membersData);

    const attendanceRes = await axios.get(`${API}/api/admin/attendance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];

    const filtered = data.filter((entry) => {
      if (attendanceType === "Trainer") {
        return entry.category === "Trainer" && entry.name === trainerName;
      } else if (attendanceType === "Member") {
        return entry.category === "Member";
      }
      return false;
    });

    const mapped = filtered.map((entry) => {
      let displayName = entry.name;

      // 🔧 Resolve member name from userId
      if ((!displayName || displayName === "Unknown Member") && entry.category === "Member") {
        const member = membersData.find((m) => m._id === entry.userId);
        displayName = member?.fullname || "Unknown Member";
      }

      return {
        title: `${displayName} (${entry.status})`,
        date: entry.date,
        color: entry.status === "Check-in" ? "#007bff" : "#ffc107",
      };
    });

    setCalendarEvents(mapped);
  } catch (err) {
    console.error("Error fetching attendance or members:", err);
  }
};

  const handleAttendanceTypeChange = (type) => {
    setAttendanceType(type);
    localStorage.setItem("attendanceType", type);
  };

  const handleSaveAttendance = async () => {
    if (!formData.date || !formData.status) {
      alert("Please select date and status");
      return;
    }

    try {
      await axios.post(`${API}/api/admin/attendance`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowModal(false);
      setFormData({
        name: trainerName,
        status: "Check-in",
        date: new Date().toISOString().split("T")[0],
        category: "Trainer",
      });

      fetchAttendance();
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to mark attendance");
    }
  };

  return (
    <MasterLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold">
            {attendanceType === "Trainer" ? "My Attendance" : "Member Attendance"} Calendar
          </h2>

          <div className="d-flex gap-2 align-items-center">
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" id="attendance-dropdown">
                {attendanceType === "Trainer" ? "My Attendance" : "Member Attendance"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleAttendanceTypeChange("Trainer")}>
                  My Attendance
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleAttendanceTypeChange("Member")}>
                  Member Attendance
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          height={600}
        />

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Mark My Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
