// adminGymRoutes.js
const express = require("express");
const router = express.Router();
const verifyClerkToken = require("../middleware/verifyClerkToken");
const Gym = require("../models/Gym");

router.get("/", verifyClerkToken, async (req, res) => {
  console.log("🔹 /api/admin/gyms route hit"); // <<<< Add this
  console.log("🔹 Clerk user email:", req.clerkUser?.email);

  try {
    const userEmail = req.clerkUser?.email;
    if (!userEmail) return res.status(401).json({ error: "Unauthorized" });

    const gyms = await Gym.find({ userEmail }).sort({ createdAt: -1 });
    console.log("🔹 Gyms found:", gyms.length);
    res.json(gyms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
