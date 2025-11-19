"use client";

import { useState, useEffect } from "react";
import { Edit, Plus } from "lucide-react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/staffmembers`;

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newMember, setNewMember] = useState({
    fullname: "",
    email: "",
    phone: "",
    plan: "Basic",
    expires: "",
    joined: "",
    trainer: false,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(API_URL);
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to fetch members", err);
    }
  };

  const handleAddOrUpdateMember = async () => {
    try {
      if (editMode && editId) {
        const res = await axios.put(`${API_URL}/${editId}`, newMember);
        setMembers((prev) =>
          prev.map((m) => (m._id === editId ? res.data : m))
        );
      } else {
        const res = await axios.post(API_URL, newMember);
        setMembers((prev) => [...prev, res.data]);
      }

      setShowModal(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
    } catch (err) {
      console.error("Error saving member", err);
    }
  };

  const resetForm = () => {
    setNewMember({
      fullname: "",
      email: "",
      phone: "",
      plan: "Basic",
      expires: "",
      joined: "",
      trainer: false,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setMembers((prev) => prev.filter((m) => m._id !== id));
      } catch (err) {
        console.error("Failed to delete member", err);
      }
    }
  };

  const getStatus = (expires) => {
    return new Date(expires) >= new Date() ? "active" : "expired";
  };

  const filteredMembers = members.filter((member) => {
    const searchMatch =
      member.fullname.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(member.expires);
    const statusMatch = filter === "All" || filter.toLowerCase() === status;
    return searchMatch && statusMatch;
  });

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">Member Management</h2>
        <p className="text-muted mb-4">
          Manage member profiles, subscriptions, and information
        </p>

        {/* Controls */}
        <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
          <input
            type="text"
            className="form-control flex-grow-1"
            placeholder="🔍 Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="btn-group ms-2">
            {["All", "Active", "Expired"].map((type) => (
              <button
                key={type}
                className={`btn btn-${filter === type ? "dark" : "outline-secondary"}`}
                onClick={() => setFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <button
            className="btn btn-dark ms-auto"
            onClick={() => {
              resetForm();
              setEditMode(false);
              setShowModal(true);
            }}
          >
            <Plus size={18} className="me-1" />
            Add Member
          </button>
        </div>

        {/* Grid */}
        <div className="row">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const initials = member.fullname
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();
              const status = getStatus(member.expires);

              return (
                <div className="col-md-4 mb-4" key={member._id}>
                  <div className="card shadow-sm h-100 border-0">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle bg-light border d-flex justify-content-center align-items-center"
                            style={{ width: 50, height: 50, fontWeight: "bold" }}
                          >
                            {initials}
                          </div>
                          <div>
                            <h5 className="mb-0">{member.fullname}</h5>
                            <small className="text-muted">{member.email}</small>
                          </div>
                        </div>
                        <span
                          className={`badge text-capitalize ${
                            status === "active"
                              ? "bg-success-subtle text-success"
                              : "bg-danger-subtle text-danger"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mb-2">
                        <strong>Plan:</strong> {member.plan}
                      </div>
                      <div className="mb-2">
                        <strong>Expires:</strong>{" "}
                        {new Date(member.expires).toLocaleDateString()}
                      </div>
                      <div className="mb-2">📞 {member.phone}</div>
                      {member.trainer && <div className="mb-2">📅 Assigned Trainer</div>}
                      <small className="text-muted">
                        Joined {new Date(member.joined).toLocaleDateString()}
                      </small>

                      <div className="d-flex gap-2 mt-3">
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => {
                            setNewMember({
                              fullname: member.fullname,
                              email: member.email,
                              phone: member.phone,
                              plan: member.plan,
                              expires: member.expires.split("T")[0],
                              joined: member.joined.split("T")[0],
                              trainer: member.trainer,
                            });
                            setEditMode(true);
                            setEditId(member._id);
                            setShowModal(true);
                          }}
                        >
                          <Edit size={16} className="me-1" />
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(member._id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center py-5 text-muted">No members found.</div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal d-block fade show" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">{editMode ? "Edit Member" : "Add Member"}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setEditId(null);
                  }}
                />
              </div>
              <div className="modal-body">
                {["fullname", "email", "phone", "expires", "joined"].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label text-capitalize">{field}</label>
                    <input
                      type={field === "expires" || field === "joined" ? "date" : "text"}
                      className="form-control"
                      value={newMember[field]}
                      onChange={(e) =>
                        setNewMember({ ...newMember, [field]: e.target.value })
                      }
                    />
                  </div>
                ))}

                <div className="mb-3">
                  <label className="form-label">Plan</label>
                  <select
                    className="form-select"
                    value={newMember.plan}
                    onChange={(e) =>
                      setNewMember({ ...newMember, plan: e.target.value })
                    }
                  >
                    <option value="Basic">Basic</option>
                    <option value="Annual">Annual</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={newMember.trainer}
                    onChange={(e) =>
                      setNewMember({ ...newMember, trainer: e.target.checked })
                    }
                  />
                  <label className="form-check-label">Assigned Trainer</label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setEditId(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddOrUpdateMember}>
                  {editMode ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}
