const mongoose = require("mongoose");

const GymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Gym name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid "],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      required: [true, "Subscription plan is required"],
      enum: ["Basic", "Standard", "Premium"], // ✅ Optional: restrict to allowed plans
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.models.Gym || mongoose.model("Gym", GymSchema);
