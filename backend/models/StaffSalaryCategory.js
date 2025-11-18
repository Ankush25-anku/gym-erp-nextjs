const mongoose = require("mongoose");

const StaffSalaryCategorySchema = new mongoose.Schema(
  {
    salaryCategory: {
      type: String,
      required: true,
      trim: true,
    },
    deductableForLeaves: {
      type: Boolean,
      default: false,
    },
    gymCode: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: String, // Clerk user ID
      required: true,
    },
    createdByEmail: {
      type: String,
      trim: true,
    },
    createdByName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StaffSalaryCategory",
  StaffSalaryCategorySchema
);
