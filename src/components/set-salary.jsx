"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Spinner, Alert, Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SetSalary() {
  const { getToken, isLoaded } = useAuth();

  const [gymCode, setGymCode] = useState("");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);

  // Step 1 selections
  const [selectedRole, setSelectedRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // 🔥 NEW
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Step 2
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [assignmentId, setAssignmentId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // -----------------------------------------------------
  // LOAD GYM CODE + USERS
  // -----------------------------------------------------
  useEffect(() => {
    const fetchGym = async () => {
      try {
        if (!isLoaded) return;
        const token = await getToken();

        const res = await axios.get(`${API_BASE}/api/gym/my-gym`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const code = res.data?.gym?.gymCode;
        if (code) {
          setGymCode(code);
          fetchUsers(code);
        }
      } catch (err) {
        console.error(err);
        setAlert({
          type: "danger",
          message: "Failed to load gym details.",
        });
      }
    };

    fetchGym();
  }, [isLoaded, getToken]);

  // -----------------------------------------------------
  // FETCH STAFF + TRAINERS (INCLUDING ID)
  // -----------------------------------------------------
  const fetchUsers = async (code) => {
    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category/roles?gymCode=${code}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const formatted = res.data.users.map((u) => ({
          ...u,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        }));
        setUsers(formatted);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: "Failed to load staff/trainer list.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // FILTER USERS BY ROLE
  // -----------------------------------------------------
  useEffect(() => {
    if (selectedRole) {
      const f = users.filter(
        (u) => u.role.toLowerCase() === selectedRole.toLowerCase()
      );
      setFilteredUsers(f);
    } else {
      setFilteredUsers([]);
    }
  }, [selectedRole, users]);

  // -----------------------------------------------------
  // STEP 2 - LOAD CATEGORIES
  // -----------------------------------------------------
  const handleNext = async () => {
    if (!selectedRole || !fullName || !selectedUser) {
      return setAlert({
        type: "danger",
        message: "Please select role & staff.",
      });
    }

    try {
      setLoading(true);
      const token = await getToken();

      // 1️⃣ CHECK IF SALARY ALREADY SET
      const check = await axios.get(
        `${API_BASE}/api/staff-salary-category/assigned-salary`,
        {
          params: {
            gymCode,
            role: selectedRole.toLowerCase(),
            fullName,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (check.data.success && check.data.data?.length > 0) {
        // Salary already exists → BLOCK STEP 2
        setAlert({
          type: "danger",
          message: "Salary already set for this staff.",
        });
        return; // ❌ STOP HERE — Do NOT open Step-2
      }
    } catch (err) {
      // Salary not found → SAFE to continue
      console.log("No salary exists. Allowing new assignment.");
    }

    // 2️⃣ IF SALARY NOT SET → OPEN STEP-2
    try {
      const token = await getToken();

      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category?gymCode=${gymCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (Array.isArray(res.data)) setCategories(res.data);

      setShowStep1(false);
      setShowStep2(true);
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: "Failed to load salary categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // SAVE SALARY ASSIGNMENT
  // -----------------------------------------------------
  const handleSaveSalary = async () => {
    const entered = categories
      .filter((c) => c.amount && Number(c.amount) > 0)
      .map((c) => ({
        salaryCategory: c.salaryCategory,
        amount: Number(c.amount),
      }));

    if (!entered.length) {
      return setAlert({
        type: "danger",
        message: "Please enter at least one salary amount.",
      });
    }

    try {
      setLoading(true);
      const token = await getToken();

      const payload = {
        gymCode,
        role: selectedRole.toLowerCase(),
        fullName,
        salaryDetails: entered,
        staffEmail: selectedUser.email, // 🔥 IMPORTANT
        staffId: selectedUser._id, // 🔥 IMPORTANT
      };

      const res = await axios.post(
        `${API_BASE}/api/staff-salary-category/assign-salary`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAlert({ type: "success", message: "Salary assigned successfully!" });
        setShowStep2(false);
        setSelectedRole("");
        setFullName("");
        setSelectedUser(null);
        setCategories([]);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to assign salary.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // FETCH EXISTING SALARY
  // -----------------------------------------------------
  const fetchAssignedSalary = async () => {
    if (!selectedRole || !fullName || !selectedUser) {
      return setAlert({
        type: "danger",
        message: "Select role & staff.",
      });
    }

    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category/assigned-salary`,
        {
          params: {
            gymCode,
            role: selectedRole.toLowerCase(),
            fullName,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success && res.data.data) {
        setCategories(res.data.data);
        setAssignmentId(res.data.assignmentId);
        setAlert({
          type: "success",
          message: "Salary details loaded.",
        });
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: "Failed to fetch salary details.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // DELETE & UPDATE SALARY (UNCHANGED)
  // -----------------------------------------------------
  const handleUpdateSalary = async () => {
    if (!assignmentId || !selectedCategory)
      return setAlert({ type: "danger", message: "Select salary record." });

    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.put(
        `${API_BASE}/api/staff-salary-category/update-salary/${assignmentId}`,
        {
          salaryDetails: [
            {
              salaryCategory: selectedCategory.salaryCategory,
              amount: Number(selectedCategory.amount),
            },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const updated = categories.map((c) =>
          c.salaryCategory === selectedCategory.salaryCategory
            ? { ...c, amount: selectedCategory.amount }
            : c
        );

        setCategories(updated);
        setShowEditModal(false);
        setAlert({ type: "success", message: "Salary updated." });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to update salary.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // DELETE SALARY
  // -----------------------------------------------------
  const handleDeleteSalary = async (categoryName) => {
    if (!window.confirm("Delete this salary item?")) return;

    try {
      setLoading(true);
      const token = await getToken();

      // 1️⃣ FETCH existing assignment details first
      const res = await axios.get(
        `${API_BASE}/api/staff-salary-category/assigned-salary`,
        {
          params: { gymCode, role: selectedRole.toLowerCase(), fullName },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const assignmentId = res.data.assignmentId;

      // 2️⃣ CALL NEW BACKEND DELETE ENDPOINT
      const deleteRes = await axios.delete(
        `${API_BASE}/api/staff-salary-category/delete-salary/${assignmentId}/${categoryName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 3️⃣ If backend says assignment deleted (no categories left)
      if (deleteRes.data.message.includes("Assignment deleted")) {
        setCategories([]); // remove table completely
        setAlert({
          type: "success",
          message: "All salary categories removed.",
        });
        return;
      }

      // 4️⃣ Otherwise update categories with the updated list
      setCategories(deleteRes.data.data);

      setAlert({
        type: "success",
        message: "Salary category removed.",
      });
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: "Failed to delete salary.",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // RENDER UI
  // -----------------------------------------------------
  const totalAmount = categories.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Set Salary</h4>
          <small className="text-muted">Assign salary to staff/trainer</small>
        </div>
        <Button variant="primary" onClick={() => setShowStep1(true)}>
          + Set New Salary
        </Button>
      </div>

      {/* ALERT */}
      {alert.message && <Alert variant={alert.type}>{alert.message}</Alert>}

      {/* LOADING */}
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" />
        </div>
      )}

      {/* SELECT STAFF */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5>Select Role & Staff</h5>

          <Form className="row g-3 mt-2">
            <div className="col-md-4">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setFullName("");
                  setSelectedUser(null);
                }}
              >
                <option value="">Select Role</option>
                <option value="Staff">Staff</option>
                <option value="Trainer">Trainer</option>
              </Form.Select>
            </div>

            <div className="col-md-5">
              <Form.Label>Full Name</Form.Label>
              <Form.Select
                value={fullName}
                onChange={(e) => {
                  const name = e.target.value;
                  setFullName(name);

                  const u = filteredUsers.find((x) => x.fullName === name);
                  setSelectedUser(u); // 🔥 Store full user object
                }}
                disabled={!selectedRole}
              >
                <option value="">Select Staff</option>
                {filteredUsers.map((u, i) => (
                  <option key={i} value={u.fullName}>
                    {u.fullName}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-3">
              <Button
                variant="outline-primary"
                className="w-100"
                onClick={fetchAssignedSalary}
              >
                Fetch
              </Button>
            </div>
          </Form>
        </div>
      </div>

      {/* SALARY TABLE */}
      {categories.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h6>
              Salary Details for <strong>{fullName}</strong> ({selectedRole})
            </h6>

            <div className="table-responsive mt-3">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((c, i) => (
                    <tr key={i}>
                      <td>{c.salaryCategory}</td>
                      <td>₹ {Number(c.amount).toLocaleString()}</td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-2"
                          onClick={() => {
                            setSelectedCategory(c);
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteSalary(c.salaryCategory)}
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <td className="fw-bold">TOTAL</td>
                    <td className="fw-bold">
                      ₹ {totalAmount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 MODAL */}
      <Modal show={showStep1} onHide={() => setShowStep1(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Staff</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setFullName("");
                  setSelectedUser(null);
                }}
              >
                <option value="">Select Role</option>
                <option value="Staff">Staff</option>
                <option value="Trainer">Trainer</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Full Name</Form.Label>
              <Form.Select
                value={fullName}
                onChange={(e) => {
                  const name = e.target.value;
                  setFullName(name);
                  const u = filteredUsers.find((x) => x.fullName === name);
                  setSelectedUser(u);
                }}
                disabled={!selectedRole}
              >
                <option value="">Select Staff</option>
                {filteredUsers.map((u, i) => (
                  <option key={i} value={u.fullName}>
                    {u.fullName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStep1(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        </Modal.Footer>
      </Modal>

      {/* STEP 2 MODAL */}
      <Modal show={showStep2} onHide={() => setShowStep2(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Enter Salary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row g-3">
              {categories.map((cat, i) => (
                <div className="col-md-6" key={i}>
                  <Form.Label>{cat.salaryCategory}</Form.Label>
                  <Form.Control
                    type="number"
                    value={cat.amount || ""}
                    onChange={(e) => {
                      const updated = [...categories];
                      updated[i].amount = e.target.value;
                      setCategories(updated);
                    }}
                    placeholder="Enter amount"
                  />
                </div>
              ))}
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStep2(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveSalary}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT SALARY MODAL */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Salary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategory && (
            <Form>
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={selectedCategory.salaryCategory}
                readOnly
              />

              <Form.Label className="mt-3">Amount (₹)</Form.Label>
              <Form.Control
                type="number"
                value={selectedCategory.amount}
                onChange={(e) =>
                  setSelectedCategory({
                    ...selectedCategory,
                    amount: e.target.value,
                  })
                }
              />
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateSalary}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
