// models/StaffApproval.js
const mongoose = require("mongoose");

const StaffApprovalSchema = new mongoose.Schema({
  gymCode: {
    type: String,
    required: true,
  },
  staffFullName: {
    type: String,
    required: true,
  },
  staffEmail: {
    type: String,
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "staff",
  },
  clerkRole: {
    type: String,
    enum: ["staff"],
    default: "staff",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  rejectedAt: Date,
  approvedBy: String,
  rejectedBy: String,
  superAdminEmail: String,
});

module.exports = mongoose.model("StaffApproval", StaffApprovalSchema);
