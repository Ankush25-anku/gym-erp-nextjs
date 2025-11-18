const mongoose = require("mongoose");

const StaffSalaryAssignmentSchema = new mongoose.Schema(
  {
    gymCode: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["staff", "trainer"],
      required: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    
    staffEmail: { type: String, required: true, trim: true },   // ✅ Added
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "GymApproval" },
    

    // 🔹 Instead of basicAllowance, pf, esi, others
    // we now directly store the selected salary category
     salaryDetails: [
      {
        salaryCategory: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],

       totalAmount: { type: Number, default: 0 },

    // Optional: If you want to store whether it’s deductable (auto synced from StaffSalaryCategory)
    deductableForLeaves: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: String, // Clerk user ID
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
  "StaffSalaryAssignment",
  StaffSalaryAssignmentSchema
);
