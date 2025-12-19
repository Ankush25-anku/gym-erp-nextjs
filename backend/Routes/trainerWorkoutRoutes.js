const express = require("express");
const router = express.Router();

const verifyClerkToken = require("../middleware/verifyClerkToken");
const WorkoutAssignment = require("../models/WorkoutAssignment");
const GymApproval = require("../models/GymApproval");

// 🔐 APPLY AUTH MIDDLEWARE TO ALL ROUTES
router.use(verifyClerkToken);

/* ============================================================
   POST: Assign workout to a member of a specific gym
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { assignedBy, memberEmail, gymCode, fromDate, repeatDays, workouts } =
      req.body;

    if (!memberEmail || !gymCode) {
      return res.status(400).json({
        success: false,
        message: "memberEmail and gymCode are required",
      });
    }

    const normalizedEmail = memberEmail.toLowerCase().trim();
    const normalizedGymCode = gymCode.trim().toUpperCase();

    // Validate member exists in that gym
    const memberDoc = await GymApproval.findOne({
      requesterEmail: normalizedEmail,
      gymCode: normalizedGymCode,
      clerkRole: "member",
      status: "approved",
    });

    if (!memberDoc) {
      return res.status(404).json({
        success: false,
        message: "This member is NOT approved for this gym",
      });
    }

    const assignment = new WorkoutAssignment({
      assignedBy,
      assignTo: "member",
      memberEmail: normalizedEmail,
      gymCode: normalizedGymCode,
      fromDate,
      repeatDays,
      workouts,
    });

    const saved = await assignment.save();

    res.status(201).json({
      success: true,
      message: "Workout assigned successfully",
      data: saved,
    });
  } catch (err) {
    console.error("❌ Error assigning workout:", err);
    res.status(500).json({
      success: false,
      message: "Failed to assign workout",
    });
  }
});

/* ============================================================
   GET: Trainer fetches workouts of a specific member
   URL: /api/trainer/workouts/assigned/:gymCode/:memberEmail
============================================================ */
router.get("/assigned/:gymCode/:memberEmail", async (req, res) => {
  try {
    const gymCode = req.params.gymCode.trim().toUpperCase();
    const memberEmail = req.params.memberEmail.trim().toLowerCase();

    const workouts = await WorkoutAssignment.find({
      assignTo: "member",
      gymCode,
      memberEmail,
    }).sort({ fromDate: -1 });

    res.json({
      success: true,
      workouts,
    });
  } catch (err) {
    console.error("❌ Error fetching member workouts:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned workouts",
    });
  }
});

/* ============================================================
   GET: Member fetches their OWN workouts
   URL: /api/trainer/workouts/member/:gymCode
============================================================ */
router.get("/member/:gymCode", async (req, res) => {
  try {
    const gymCode = req.params.gymCode.trim().toUpperCase();
    const memberEmail = req.clerkUser?.email;

    if (!memberEmail) {
      return res.status(400).json({
        success: false,
        message: "Member email missing",
      });
    }

    const normalizedEmail = memberEmail.toLowerCase().trim();

    const workouts = await WorkoutAssignment.find({
      assignTo: "member",
      gymCode,
      memberEmail: normalizedEmail,
    }).sort({ fromDate: -1 });

    res.json({
      success: true,
      workouts,
    });
  } catch (err) {
    console.error("❌ Error fetching own workouts:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch workouts",
    });
  }
});

/* ============================================================
   PUT: Update workout assignment
============================================================ */
router.put("/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const updated = await WorkoutAssignment.findByIdAndUpdate(
      assignmentId,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Workout assignment not found",
      });
    }

    res.json({
      success: true,
      message: "Workout updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Failed to update workout:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update workout",
    });
  }
});

/* ============================================================
   DELETE: Remove workout assignment
============================================================ */
router.delete("/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const deleted = await WorkoutAssignment.findByIdAndDelete(assignmentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Workout assignment not found",
      });
    }

    res.json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (err) {
    console.error("❌ Failed to delete workout:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete workout",
    });
  }
});
// ---------------------------------------------------------------
// TRAINER → GET all assigned workouts of a gym
// ---------------------------------------------------------------
router.get("/all/:gymCode", async (req, res) => {
  try {
    const gymCode = req.params.gymCode.trim().toUpperCase();

    const workouts = await WorkoutAssignment.find({
      assignTo: "member",
      gymCode,
    }).sort({ fromDate: -1 });

    res.json({
      success: true,
      workouts,
    });
  } catch (err) {
    console.error("❌ Error fetching all workouts:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch workouts",
    });
  }
});

/* ============================================================
   GET: Fetch assigned workouts of a specific member (trainer view)
   URL: /api/trainer/workouts/member-fetch/:gymCode/:memberEmail
============================================================ */
router.get("/member-fetch/:gymCode/:memberEmail", async (req, res) => {
  try {
    const gymCode = req.params.gymCode.trim().toUpperCase();
    const memberEmail = req.params.memberEmail.trim().toLowerCase();

    const workouts = await WorkoutAssignment.find({
      assignTo: "member",
      gymCode,
      memberEmail,
    }).sort({ fromDate: -1 });

    res.json({
      success: true,
      data: workouts,
    });
  } catch (err) {
    console.error("❌ Error fetching workouts for member:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch member workouts",
    });
  }
});

module.exports = router;
