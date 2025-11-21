const express = require("express");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const ClerkUser = require("../models/ClerkUser");
const GymApproval = require("../models/GymApproval");

const router = express.Router();

router.get("/admin-info", verifyClerkToken, async (req, res) => {
  try {
    const email = req.clerkUser.email; // Logged-in user's email

    // 1️⃣ Fetch Clerk user information
    const user = await ClerkUser.findOne({ email });

    // 2️⃣ Fetch gym approval record (status = approved)
    const gymApproval = await GymApproval.findOne({
      adminEmail: email, // ← correct field from your model
      status: "approved",
    });

    res.json({
      fullName: user?.fullName || "Admin",
      email: email,
      role: user?.role || "admin",
      gymCode: gymApproval?.gymCode || "",
      approvalStatus: gymApproval?.status || "none",
    });
  } catch (err) {
    console.error("Error admin-info:", err);
    res.status(500).json({ error: "Failed to fetch admin info" });
  }
});

module.exports = router;
