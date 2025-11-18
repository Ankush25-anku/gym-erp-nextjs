const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    gymCode: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: String, // Clerk or Admin email
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
