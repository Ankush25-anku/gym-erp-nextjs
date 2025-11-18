const express = require("express");
const router = express.Router();

// Clerk auth middleware
const verifyClerkToken = require("../middleware/verifyClerkToken");

const Member = require("../models/Member");
const Trainer = require("../models/admintrainer");
const Staff = require("../models/Staff");
const Expense = require("../models/Expense");
const Attendance = require("../models/Attendance");

// GET /api/admin/stats
// Returns dashboard stats scoped to the logged-in user
router.get("/stats", verifyClerkToken, async (req, res) => {
  try {
    console.log("🔹 Incoming request to /stats");
    console.log("🔹 req.clerkUser:", req.clerkUser);

    const userEmail = req.clerkUser?.email;
    if (!userEmail) {
      return res
        .status(400)
        .json({ error: "Missing userEmail from Clerk token" });
    }

    // ✅ Count Members
    const membersCount = await Member.countDocuments({
      userEmail,
      isDeleted: false,
    });

    // ✅ Count Trainers
    const trainersCount = await Trainer.countDocuments({ userEmail });

    // ✅ Count Staff
    const staffCount = await Staff.countDocuments({ userEmail });

    // ✅ Total Expenses
    const expensesTotalAgg = await Expense.aggregate([
      { $match: { userEmail } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expensesTotal = expensesTotalAgg[0]?.total || 0;

    // ✅ Attendance check-ins for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const memberCheckins = await Attendance.countDocuments({
      userEmail,
      category: "Member",
      status: "Check-in",
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const staffTrainerCheckins = await Attendance.countDocuments({
      userEmail,
      category: { $in: ["Staff", "Trainer"] },
      status: "Check-in",
      createdAt: { $gte: today, $lt: tomorrow },
    });

    console.log("✅ Returning stats:", {
      membersCount,
      trainersCount,
      staffCount,
      expensesTotal,
      memberCheckins,
      staffTrainerCheckins,
    });

    res.json({
      members: membersCount,
      trainers: trainersCount,
      staff: staffCount,
      expenses: expensesTotal,
      memberCheckins,
      staffTrainerAttendance: staffTrainerCheckins,
    });
  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
