// backend/routes/teamMemberRoutes.js
import express from "express";
import verifyClerkToken from "../middleware/verifyClerkToken.js";
import AdminStaff from "../models/AdminStaff.js"; // Same model

const router = express.Router();

/**
 * POST /api/team-members
 * Save a new team member
 */
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const { fullName, email, phone, department, position, requestAdminAccess } = req.body;

    const existing = await AdminStaff.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Team member already exists" });
    }

    const teamMember = new AdminStaff({
      fullName,
      email,
      phone,
      department,
      position,
      requestAdminAccess,
      createdBy: req.clerkUser.sub,
    });

    await teamMember.save();
    res.status(201).json({ message: "Team member saved successfully", teamMember });
  } catch (err) {
    console.error("❌ Error saving team member:", err);
    res.status(500).json({ message: "Server error while saving team member" });
  }
});

/**
 * GET /api/team-members
 * Get all team members for logged-in Clerk user
 */
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const list = await AdminStaff.find({ createdBy: req.clerkUser.sub }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ Error fetching team members:", err);
    res.status(500).json({ message: "Server error while fetching team members" });
  }
});

export default router;
