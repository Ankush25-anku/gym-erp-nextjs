const mongoose = require("mongoose");

const SuperGymSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  pincode: String,
  subscriptionPlan: String,
  status: { type: String, default: "inactive" },
  gymCode: { type: String, required: true, unique: true, uppercase: true },
  createdBy: String,
  members: [{ type: String }],
  profileImage: { type: String, default: "" },

  // 🟡 Approval workflow
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  approvalRequestedBy: String, // Clerk user ID or email of the admin
  approvedBy: String, // Clerk user ID or email of the superadmin
  approvalRequestedAt: Date,
  approvedAt: Date,
});

module.exports = mongoose.model("SuperGym", SuperGymSchema);
