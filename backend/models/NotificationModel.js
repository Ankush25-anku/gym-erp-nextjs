const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    gymCode: { type: String, default: null },
    receiverId: { type: String, default: "all" }, // "all" or specific userMongoId
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object, default: null },
    sentBy: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
