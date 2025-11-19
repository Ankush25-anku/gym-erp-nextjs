"use client";

import { useEffect, useState } from "react";
import { Edit, Plus, Trash, Users } from "lucide-react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/staffplans`;

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    billing: "month",
    duration: "",
    tag: "",
    status: "active",
    members: 0,
    features: [""],
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(API_URL);
      setPlans(res.data);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const addFeatureField = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      price: "",
      billing: "month",
      duration: "",
      tag: "",
      status: "active",
      members: 0,
      features: [""],
    });
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan._id);
    setFormData({ ...plan });
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    try {
      if (editingId) {
        const res = await axios.put(`${API_URL}/${editingId}`, formData);
        setPlans((prev) =>
          prev.map((p) => (p._id === editingId ? res.data : p))
        );
      } else {
        const res = await axios.post(API_URL, formData);
        setPlans((prev) => [...prev, res.data]);
      }
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setPlans((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterLayout>
      <div className="container mt-4">
        <h2 className="fw-bold">Subscription Plans</h2>
        <p className="text-muted mb-4">
          Manage membership plans, pricing, and features
        </p>

        {/* Search & Add */}
        <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
          <input
            type="text"
            className="form-control flex-grow-1"
            placeholder="🔍 Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-dark ms-auto" onClick={openAddModal}>
            <Plus size={18} className="me-1" />
            Add Plan
          </button>
        </div>

        {/* Grid */}
        <div className="row">
          {filteredPlans.map((plan) => (
            <div className="col-md-3 mb-4" key={plan._id}>
              <div
                className={`card h-100 border-2 ${
                  plan.tag === "Most Popular"
                    ? "border-primary"
                    : "border-light"
                }`}
              >
                <div className="card-body d-flex flex-column position-relative">
                  {plan.tag === "Most Popular" && (
                    <div className="badge bg-primary position-absolute top-0 start-50 translate-middle-x mt-2">
                      {plan.tag}
                    </div>
                  )}

                  <h5 className="fw-bold text-center mt-4">{plan.name}</h5>
                  <h3 className="text-center">
                    <span className="text-muted">$</span>
                    {plan.price}
                    <small className="text-muted"> /{plan.billing}</small>
                  </h3>
                  <div className="text-center text-muted mb-3">
                    {plan.duration}
                  </div>

                  <ul className="list-unstyled small mb-3">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="mb-1 text-success">
                        ✔ {feat}
                      </li>
                    ))}
                  </ul>

                  <hr />
                  <div className="d-flex justify-content-between text-muted small">
                    <span>
                      <Users size={14} className="me-1" />
                      {plan.members}
                    </span>
                    <span
                      className={`badge bg-${
                        plan.status === "active" ? "success" : "secondary"
                      }-subtle text-${
                        plan.status === "active" ? "success" : "secondary"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between mt-3">
                    <button
                      className="btn btn-outline-dark btn-sm w-100 me-1"
                      onClick={() => openEditModal(plan)}
                    >
                      <Edit size={16} className="me-1" />
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeletePlan(plan._id)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="row mt-5">
          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-primary text-white rounded px-3 py-2 fs-4">
                  <i className="bi bi-currency-dollar"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Revenue</div>
                  <div className="fw-bold fs-5">
                    $
                    {plans
                      .reduce(
                        (acc, p) =>
                          acc + parseFloat(p.price || 0) * (p.members || 0),
                        0
                      )
                      .toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white rounded px-3 py-2 fs-4">
                  <i className="bi bi-people"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Members</div>
                  <div className="fw-bold fs-5">
                    {plans.reduce((acc, p) => acc + (p.members || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-purple text-white rounded px-3 py-2 fs-4">
                  <i className="bi bi-clock"></i>
                </div>
                <div>
                  <div className="text-muted small">Active Plans</div>
                  <div className="fw-bold fs-5">
                    {plans.filter((p) => p.status === "active").length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal d-block fade show" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? "Edit Plan" : "Add Plan"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                {/* Form Fields */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Billing</label>
                    <select
                      className="form-select"
                      value={formData.billing}
                      onChange={(e) =>
                        setFormData({ ...formData, billing: e.target.value })
                      }
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Tag</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Members</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.members}
                    onChange={(e) =>
                      setFormData({ ...formData, members: +e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Features</label>
                  {formData.features.map((feat, idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="form-control mb-2"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    />
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={addFeatureField}
                  >
                    + Add Feature
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSavePlan}>
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}
