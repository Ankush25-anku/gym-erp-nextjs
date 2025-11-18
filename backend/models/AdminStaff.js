const mongoose = require("mongoose");

const AdminStaffSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: "staff",
      enum: ["staff", "trainer", "admin", "superadmin"],
    },
    position: {
      type: String,
      trim: true, // e.g., "Receptionist", "Cleaner"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
    },

    // 🏋️ Gym linkage
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
    },

    gymCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },

    createdByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// 🧩 Indexes for faster queries
AdminStaffSchema.index({ gymCode: 1, status: 1 });
AdminStaffSchema.index({ createdByEmail: 1 });

module.exports = mongoose.model("AdminStaffModel", AdminStaffSchema);
