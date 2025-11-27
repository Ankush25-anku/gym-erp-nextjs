const mongoose = require("mongoose");

const FcmTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: ["ios", "android", "web"], default: "web" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ClerkUserSchema = new mongoose.Schema(
  {
    sub: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    fullName: { type: String, default: "" },
    role: {
      type: String,
      enum: ["superadmin", "admin", "staff", "member", "trainer", "trainer"],
      default: "member",
    },
    phone: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },

    requestAdminAccess: { type: Boolean, default: false },

    // 🔥 FIX: Store Gym Code instead of Gym ID ✅
    gymCode: { type: String, default: "" },

    // 🔥 FIX: Store multiple FCM tokens per user ✅
    fcmTokens: { type: [FcmTokenSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClerkUser", ClerkUserSchema);
