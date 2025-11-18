const mongoose = require("mongoose");

const AdminStaffAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminStaffModel", // ✅ Correct reference to staff model
      required: true,
    },
    gymCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Leave"],
      default: "Present",
    },
    role: {
      type: String,
      default: "staff",
    },
    markedBy: {
      type: String, // admin email
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// 🧩 Compound index for unique attendance per staff per day
AdminStaffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model(
  "AdminStaffAttendanceNew",
  AdminStaffAttendanceSchema
);
