const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    department: String,
    position: String,
    profileImage: String,
    role: String,
    requestAdminAccess: Boolean,
    createdBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
