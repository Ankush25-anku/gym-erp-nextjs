const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    gymCode: {
      type: String,
      required: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
      enum: ["dumbbell", "weight", "machine", "treadmill", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "In Use", "Damaged"],
      default: "Available",
    },

    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", InventorySchema);
