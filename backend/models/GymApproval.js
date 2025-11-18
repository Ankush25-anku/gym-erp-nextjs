// const mongoose = require("mongoose");

// const GymApprovalSchema = new mongoose.Schema({
//   gymCode: {
//     type: String,
//     required: true,
//   },
//   fullName: {
//     type: String,
//     required: true,
//   },
//   adminEmail: {
//     type: String,
//     required: true,
//   },
//   // Internal display role for UI ("admin" or "owner")
//   role: {
//     type: String,
//     enum: ["superadmin", "admin", "member", "trainer"],
//     default: "member",
//   },
//   // Original Clerk role ("admin" or "superadmin")
//   clerkRole: {
//     type: String,
//     enum: ["admin", "superadmin"],
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending",
//   },
//   requestedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   approvedAt: Date,
//   rejectedAt: Date,
//   approvedBy: String,
//   rejectedBy: String,

//   // Optional: track which SuperAdmin approved the request
//   superAdminEmail: {
//     type: String,
//   },
// });

// module.exports = mongoose.model("GymApproval", GymApprovalSchema);

const mongoose = require("mongoose");

const GymApprovalSchema = new mongoose.Schema({
  gymCode: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  // Internal display role for UI ("superadmin", "admin", "staff", etc.)
  role: {
    type: String,
    enum: ["superadmin", "admin", "staff", "member", "trainer"],
    default: "staff",
  },
  // Original Clerk role ("superadmin", "admin", "staff")
  clerkRole: {
    type: String,
    enum: ["superadmin", "admin", "staff", "member", "trainer"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  profileImage: String,
  requesterEmail: { type: String, lowercase: true, trim: true },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  rejectedAt: Date,
  approvedBy: String,
  rejectedBy: String,

  // Optional: track which SuperAdmin approved the request
  superAdminEmail: {
    type: String,
  },
});

GymApprovalSchema.index(
  { gymCode: 1, adminEmail: 1, requesterEmail: 1 },
  { unique: true }
);

module.exports = mongoose.model("GymApproval", GymApprovalSchema);
