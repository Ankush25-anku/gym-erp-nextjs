const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    plan: { type: String, required: true },
    address: { type: String },
    expires: { type: String },
    status: { type: String, default: "active" },
    joined: { type: String },
    initials: { type: String },
    image: { type: String }, // ✅ Profile image

    // ✅ Emergency contact details
    emergency: {
      name: String,
      phoneno: String,
      relation: String,
    },

    // ✅ Health details
    health: {
      height: String,
      weight: String,
      bloodType: String,
      medicalConditions: String,
    },

    // ✅ Role of member
    role: {
      type: String,
      enum: ["member", "trainer", "staff", "admin"],
      default: "member",
    },

    // ✅ Associated Gym
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
    },

    // ✅ User reference (who added this member)
    // ✅ Member.js
    // createdBy: {
    //   type: String, // Clerk user ID is a string
    //   required: true,
    // },

    userId: { type: String, required: true },

    // ✅ For user-specific filtering
    userEmail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // ✅ Adds createdAt and updatedAt fields
  }
);

const Member = mongoose.model("Member", memberSchema);
module.exports = Member;

module.exports = mongoose.model("Member", memberSchema);
