// fixGymApprovalClerkRole.js
const mongoose = require("mongoose");
const GymApproval = require("./models/GymApproval"); // adjust path if needed

// ✅ Replace with your MongoDB URI
const MONGO_URI = "mongodb://127.0.0.1:27017/gymerp";

async function updateClerkRole() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔹 Connected to MongoDB");

    const result = await GymApproval.updateMany(
      { clerkRole: { $exists: false } },
      { $set: { clerkRole: "admin" } }
    );

    console.log(`✅ Updated ${result.modifiedCount} documents`);

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error updating documents:", err);
    mongoose.disconnect();
  }
}

updateClerkRole();
