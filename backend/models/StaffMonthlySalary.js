const mongoose = require("mongoose");

const StaffMonthlySalarySchema = new mongoose.Schema({
  staffEmail: { type: String, required: true },
  fullName: String,
  role: String,
  gymCode: String,

  year: Number,
  month: Number,

  present: Number,
  absent: Number,
  leave: Number,
  halfDay: Number,
  casualLeave: Number,
  sickLeave: Number,
  totalDays: Number,

  grossSalary: Number,
  deducted: Number,
  netSalary: Number,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "StaffMonthlySalary",
  StaffMonthlySalarySchema
);
