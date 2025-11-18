const mongoose = require("mongoose");

const memberSubscriptionPaymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true, // link to the Member collection
    },

    gymCode: {
      type: String,
      required: true, // always fetched from GymApproval
    },

    email: {
      type: String,
      required: true,
    },

    planName: {
      type: String,
      enum: ["Silver", "Gold", "Platinum"],
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0, // small safety check
    },

    // ✅ Allow multiple gateways & default to Razorpay
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Cash", "Razorpay", "Online"],
      default: "Razorpay",
      required: true,
    },

    status: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Paid",
    },

    transactionId: {
      type: String,
      default: function () {
        return "SUB-" + Date.now();
      },
    },

    paidDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError during hot reloads (important for Nodemon/Next.js)
module.exports =
  mongoose.models.MemberSubscriptionPayment ||
  mongoose.model("MemberSubscriptionPayment", memberSubscriptionPaymentSchema);
