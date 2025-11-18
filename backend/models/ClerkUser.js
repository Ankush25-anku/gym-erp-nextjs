const mongoose = require("mongoose");
// models/ClerkUser.js
const ClerkUserSchema = new mongoose.Schema(
  {
    sub: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    fullName: { type: String, default: "" },
    role: {
      type: String,
      enum: ["superadmin", "admin", "staff", "member", "trainer"],
      default: "member",
    },
    phone: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },

    // ✅ Add this field
    requestAdminAccess: { type: Boolean, default: false },

    // ✅ Optional staff info fields
    department: { type: String, default: "" },
    position: { type: String, default: "" },
  },
  { timestamps: true }
);



module.exports = mongoose.model("ClerkUser", ClerkUserSchema);
