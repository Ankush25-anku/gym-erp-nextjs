"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FaEdit } from "react-icons/fa";
import { Modal, Button, Form, Spinner, Card } from "react-bootstrap";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StaffAttendance({ gymCodeProp }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [staffList, setStaffList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gymCode, setGymCode] = useState(gymCodeProp || "");
  const [userRole, setUserRole] = useState("");

  // Modal states
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [modalCategory, setModalCategory] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalStaffList, setModalStaffList] = useState([]);

  useEffect(() => {
    // Always reset to default empty selections on page load
    setSelectedCategory("");
    setSelectedDate("");
  }, []);

  // ✅ Whenever category or date changes, save them locally
  useEffect(() => {
    if (selectedCategory)
      localStorage.setItem("selectedCategory", selectedCategory);
    if (selectedDate) localStorage.setItem("selectedDate", selectedDate);
  }, [selectedCategory, selectedDate]);

  // ❌ Removed auto-fetch effect (manual fetch via "Fetch" button now)

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("");

  // ✅ Load gym code & role
  useEffect(() => {
    if (!user) return;
    const storedRole = localStorage.getItem("userRole") || "staff";
    setUserRole(storedRole);

    if (!gymCodeProp) {
      const email = user?.primaryEmailAddress?.emailAddress;
      const gymKey = `joinedGymCode_${storedRole}_${email}`;
      const storedGymCode = localStorage.getItem(gymKey);
      setGymCode(storedGymCode || "");
    }
  }, [user, gymCodeProp]);

  // ✅ Clerk token helper
  const getClerkToken = async () => {
    if (!isLoaded || !isSignedIn) return null;
    try {
      return await getToken();
    } catch (err) {
      console.error("❌ Token error:", err);
      return null;
    }
  };

  // ✅ Fetch staff/trainer list for display (via Fetch button)
  const fetchStaffList = async () => {
    if (!gymCode || !selectedCategory || !selectedDate) {
      alert("Please select category and date first.");
      return;
    }

    setLoading(true);
    const token = await getClerkToken();
    if (!token) return alert("Please login again.");

    try {
      // ✅ Step 1: Fetch staff or trainer list
      const endpoint =
        selectedCategory === "Trainer"
          ? `${API_BASE}/api/admin/trainer/list?gymCode=${gymCode}`
          : `${API_BASE}/api/admin/staff-attendance/staff-list?gymCode=${gymCode}`;

      const staffRes = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetched =
        selectedCategory === "Trainer"
          ? staffRes.data.trainers || []
          : staffRes.data.staff || [];

      setStaffList(fetched);

      // ✅ Step 2: Fetch attendance for selected date
      const attendanceRes = await axios.get(
        `${API_BASE}/api/admin/staff-attendance/fetch-attendance?gymCode=${gymCode}&date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (
        attendanceRes.data.success &&
        attendanceRes.data.attendance.length > 0
      ) {
        const attendanceMap = {};
        attendanceRes.data.attendance.forEach((a) => {
          attendanceMap[a.staffId] = { status: a.status };
        });

        console.log("🟢 Loaded previous attendance:", attendanceMap);
        setAttendanceData(attendanceMap);
      } else {
        console.log("⚪ No previous attendance found for this date");
        setAttendanceData({});
      }
    } catch (error) {
      console.error("❌ Fetch error:", error.response?.data || error);
      alert("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle attendance change
  const handleAttendanceChange = (staffId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [staffId]: { status },
    }));
  };

  // ✅ Submit attendance
  const handleSubmitAttendance = async () => {
    try {
      const token = await getToken();
      if (!token) return alert("Please login again.");

      // ✅ Always prefer modalDate & modalCategory when inside modal
      const dateToUse = modalDate || selectedDate;
      const categoryToUse = modalCategory || selectedCategory;

      console.log("📅 Selected Date (final):", dateToUse);
      console.log("🏋️ Gym Code:", gymCode);
      console.log("👥 Category:", categoryToUse);
      console.log("🧾 Staff Count:", staffList.length || modalStaffList.length);

      if (!dateToUse || !gymCode)
        return alert("Please select date & gym before submitting.");

      // ✅ Prefer modalStaffList if available (attendance marking happens in modal)
      const staffSource = modalStaffList.length ? modalStaffList : staffList;

      const formattedAttendance = staffSource.map((staff) => {
        const staffEmail =
          staff.requesterEmail ||
          staff.email ||
          staff.staffEmail ||
          staff.contactEmail ||
          staff.workEmail ||
          ""; // ✅ fallback to empty string if no email found

        return {
          staffId: staff._id,
          staffEmail,
          status: attendanceData[staff._id]?.status || "Absent",
        };
      });

      // 🔍 Debug log to verify before sending
      console.log("🟢 Attendance payload to backend:", formattedAttendance);

      if (formattedAttendance.length === 0)
        return alert("No attendance data to save.");

      const res = await axios.post(
        `${API_BASE}/api/admin/staff-attendance/mark-attendance`,
        {
          gymCode,
          date: dateToUse,
          category: categoryToUse, // optional but useful for backend tracking
          attendance: formattedAttendance,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("✅ Attendance saved successfully!");
        setShowStep2(false);

        // ✅ Clear all modal + attendance data after successful submission
        setModalDate("");
        setModalCategory("");
        setStaffList([]);
        setModalStaffList([]);
        setAttendanceData({});
        setSelectedDate(dateToUse); // keep last marked date visible if needed
      } else {
        alert("⚠️ " + res.data.message);
      }
    } catch (err) {
      console.error("❌ Submit error:", err.response?.data || err);
      alert(
        "Failed to save attendance — " + (err.response?.data?.message || "")
      );
    }
  };

  // const fetchStaffForModal = async (category, date) => {
  //   if (!gymCode || !category || !date) return;

  //   setLoading(true);
  //   const token = await getClerkToken();
  //   if (!token) return alert("Please login again.");

  //   try {
  //     const endpoint =
  //       category === "Trainer"
  //         ? `${API_BASE}/api/admin/trainer/list?gymCode=${gymCode}`
  //         : `${API_BASE}/api/admin/staff-attendance/staff-list?gymCode=${gymCode}`;

  //     const res = await axios.get(endpoint, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const fetched =
  //       category === "Trainer" ? res.data.trainers || [] : res.data.staff || [];

  //     setStaffList(fetched);
  //     setAttendanceData({});
  //   } catch (err) {
  //     console.error("❌ Modal fetch error:", err);
  //     alert("Error fetching staff for attendance.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // ✅ Step1 → Step2
  // ✅ Step 1 → Step 2 (open modal)
  const handleNext = async () => {
    // 🧠 Make sure user selected both before proceeding
    if (!modalDate || !modalCategory) {
      alert("Please select both date and category.");
      return;
    }

    console.log("➡️ Moving to Step 2 with:");
    console.log("📅 Modal Date:", modalDate);
    console.log("🏋️ Category:", modalCategory);
    console.log("🏢 Gym Code:", gymCode);

    // ✅ Sync modal values with main ones so they can be reused later
    setSelectedCategory(modalCategory);
    setSelectedDate(modalDate);

    setShowStep1(false);
    setShowStep2(true);

    if (!gymCode) return alert("No gym code found.");

    setLoading(true);
    const token = await getClerkToken();
    if (!token) return alert("Please login again.");

    try {
      const endpoint =
        modalCategory === "Trainer"
          ? `${API_BASE}/api/admin/trainer/list?gymCode=${gymCode}`
          : `${API_BASE}/api/admin/staff-attendance/staff-list?gymCode=${gymCode}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetched =
        modalCategory === "Trainer"
          ? res.data.trainers || []
          : res.data.staff || [];

      setModalStaffList(fetched);
      setAttendanceData({});
    } catch (err) {
      console.error("❌ Step 2 staff fetch error:", err);
      alert("Error fetching staff for attendance.");
    } finally {
      setLoading(false);
    }
  };

  // 🩵 When user clicks the Edit (✏️) icon
  const handleEditClick = (staff) => {
    setSelectedStaff(staff); // Store clicked staff in state
    const currentStatus = attendanceData[staff._id]?.status || "";
    setUpdatedStatus(currentStatus); // Pre-fill dropdown if status exists
    setShowUpdateModal(true); // Show the modal
  };

  const handleUpdateAttendance = async () => {
    if (!selectedStaff || !updatedStatus) {
      return alert("Please select a status.");
    }

    try {
      const token = await getClerkToken();
      if (!token) return alert("Please login again.");

      // Update local state first (instant UI feedback)
      setAttendanceData((prev) => ({
        ...prev,
        [selectedStaff._id]: { status: updatedStatus },
      }));

      // Optional: make API call to save change immediately
      await axios.put(
        `${API_BASE}/api/admin/staff-attendance/update`,
        {
          gymCode,
          staffId: selectedStaff._id,
          date: selectedDate,
          status: updatedStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Attendance updated successfully!");
      setShowUpdateModal(false);
    } catch (err) {
      console.error("❌ Update error:", err);
      alert("Failed to update attendance.");
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-dark">
          📋 Staff Attendance — Gym: {gymCode || "Loading..."}
        </h3>
        <Button variant="primary" onClick={() => setShowStep1(true)}>
          + Mark Attendance
        </Button>
      </div>

      {/* --- New Section for Fetch by Date & Category --- */}
      <div className="bg-white shadow-sm rounded-4 p-4 mb-4">
        <div className="row g-3 align-items-end">
          {/* Category */}
          <div className="col-md-4">
            <Form.Group>
              <Form.Label className="fw-semibold text-dark">
                Select Category
              </Form.Label>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="" disabled>
                  Select Category
                </option>
                <option value="Staff">Staff</option>
                <option value="Trainer">Trainer</option>
              </Form.Select>
            </Form.Group>
          </div>

          {/* Date */}
          <div className="col-md-4">
            <Form.Group>
              <Form.Label className="fw-semibold text-dark">
                Select Date
              </Form.Label>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </Form.Group>
          </div>

          {/* Fetch Button */}
          <div className="col-md-2">
            <Button
              variant="success"
              className="w-100 fw-semibold"
              onClick={fetchStaffList}
              disabled={!selectedCategory || !selectedDate} // ✅ only active after both selected
            >
              Fetch
            </Button>
          </div>
        </div>
      </div>

      {/* --- Display fetched list below --- */}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p>Loading data...</p>
        </div>
      ) : staffList.length > 0 ? (
        <div className="bg-white rounded-4 shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark mb-0">
              Fetched Staff/Trainer List
            </h5>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="bg-dark text-white rounded-top">
                <tr>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff, idx) => (
                  <tr key={idx} className="border-bottom">
                    <td className="fw-semibold text-dark">
                      {staff.fullName || "Unnamed"}
                    </td>
                    <td className="text-muted small">
                      {staff.role || selectedCategory}
                    </td>
                    <td>{attendanceData[staff._id]?.status || "Not Marked"}</td>
                    <td>
                      <FaEdit
                        onClick={() => handleEditClick(staff)}
                        role="button"
                        size={18}
                        color="#0d6efd"
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ✅ Only show "No data" if Fetch was clicked
        selectedCategory &&
        selectedDate && (
          <p className="text-center text-muted">No data fetched yet.</p>
        )
      )}
      {/* ---------------- Existing Modals ---------------- */}

      {/* Step 1 Modal */}
      <Modal
        show={showStep1}
        onHide={() => setShowStep1(false)}
        centered
        className="attendance-modal"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-semibold text-dark">
            Mark Attendance
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-white text-dark">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Date</Form.Label>
              <Form.Control
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className="border rounded-3 shadow-sm"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Category</Form.Label>
              <Form.Select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="border rounded-3 shadow-sm"
              >
                <option value="">Select Category</option>
                <option value="Staff">Staff</option>
                <option value="Trainer">Trainer</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setShowStep1(false)}
            className="rounded-3 px-4"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleNext}
            className="rounded-3 px-4"
          >
            Next
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Step 2 Modal */}
      <Modal
        show={showStep2}
        onHide={() => setShowStep2(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="bg-white border-bottom">
          <Modal.Title className="text-dark fw-bold">
            Manual Staff Attendance
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-white text-dark">
          <div className="bg-white text-gray-800 rounded-2xl shadow-sm p-3 max-h-[80vh] overflow-y-auto">
            <h5 className="text-xl font-semibold mb-4">
              Manual Staff Attendance
            </h5>

            <div className="bg-blue-50 border-l-4 border-primary text-primary p-3 mb-4 rounded-md">
              Mark attendance for each staff.
            </div>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p>Loading staff...</p>
              </div>
            ) : modalStaffList.length === 0 ? ( // ✅ Correct check
              <p className="text-center text-muted">
                No staff found for this gym.
              </p>
            ) : (
              modalStaffList.map((staff, index) => (
                <div key={index} className="mb-4 border-bottom pb-3">
                  <h6 className="fw-semibold fs-6">
                    {staff.fullName || "Unnamed"}
                  </h6>
                  <p className="text-muted small">{staff.role || "Staff"}</p>

                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {[
                      "Present",
                      "Absent",
                      "Leave",
                      "Half Day",
                      "Casual Leave",
                      "Sick Leave",
                    ].map((status) => (
                      <label
                        key={status}
                        className="d-flex align-items-center gap-2 text-secondary"
                      >
                        <input
                          type="radio"
                          name={`attendance-${staff._id}`}
                          value={status}
                          checked={attendanceData[staff._id]?.status === status}
                          onChange={() =>
                            handleAttendanceChange(staff._id, status)
                          }
                          className="form-check-input accent-primary"
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="bg-white border-top">
          <Button
            variant="outline-secondary"
            onClick={() => setShowStep2(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitAttendance}
            disabled={saving}
          >
            {saving ? "Saving..." : "Submit Attendance"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Update Attendance Modal */}
      <Modal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold text-dark">
            Update Attendance
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedStaff && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Staff Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedStaff.fullName || selectedStaff.name}
                  disabled
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedStaff.role || selectedCategory}
                  disabled
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attendance Status</Form.Label>
                <Form.Select
                  value={updatedStatus}
                  onChange={(e) => setUpdatedStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowUpdateModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateAttendance}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
