const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: String,
    phone: String,
    position: String,
    status: {
      type: String,
      enum: ["Present", "Absent"], // Capitalized to match your route checks
      required: true,
    },

    userId: { type: String, required: true },

    joinedDate: {
      type: Date,
      default: Date.now,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    userEmail: String, // the user who created/owns this staff member
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Staff", staffSchema);
