// const mongoose = require("mongoose");

// const staffAttendanceSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["Check-in", "Check-out"],
//     required: true,
//   },
//   date: {
//     type: String,
//     required: true,
//   },
//   time: {
//     type: Date,
//     default: Date.now,
//   },
// }, {
//   timestamps: true,
// });

// module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);

// models/StaffAttendance.js
const mongoose = require("mongoose");

const staffAttendanceSchema = new mongoose.Schema(
  {
    gymCode: {
      type: String,
      required: true,
    },

    staffEmail: {
      type: String, // ✅ added this for easier frontend matching
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    attendance: [
      {
        staffId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "GymApproval", // assuming staff are stored there
          required: true,
        },
        staffEmail: { type: String, required: true },
        status: {
          type: String,
          enum: [
            "Present",
            "Absent",
            "Leave",
            "Half Day",
            "Casual Leave",
            "Sick Leave",
          ],
          required: true,
        },
      },
    ],
    createdBy: {
      type: String, // email of admin/staff who marked attendance
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);
