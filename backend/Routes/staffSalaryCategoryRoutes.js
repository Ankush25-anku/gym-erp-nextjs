const express = require("express");
const router = express.Router();
const StaffSalaryCategory = require("../models/StaffSalaryCategory");
const GymApproval = require("../models/GymApproval");
const StaffSalaryAssignment = require("../models/StaffSalaryAssignment");
const StaffAttendance = require("../models/StaffAttendance");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const StaffMonthlySalary = require("../models/StaffMonthlySalary");

// ====================================================================
//  CREATE SALARY CATEGORY
// ====================================================================
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const { salaryCategory, deductableForLeaves, gymCode } = req.body;
    if (!salaryCategory || !gymCode)
      return res.status(400).json({ message: "Missing fields" });

    const newCategory = new StaffSalaryCategory({
      salaryCategory,
      deductableForLeaves,
      gymCode,
      createdBy: req.clerkUser.sub,
      createdByEmail: req.clerkUser.email,
      createdByName: req.clerkUser.fullName,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category", error });
  }
});

// ====================================================================
//  READ CATEGORIES
// ====================================================================
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.query;
    if (!gymCode)
      return res.status(400).json({ message: "Gym code is required" });

    const categories = await StaffSalaryCategory.find({ gymCode }).sort({
      createdAt: -1,
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories", error });
  }
});

// ====================================================================
//  UPDATE CATEGORY
// ====================================================================
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const updated = await StaffSalaryCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Error updating category", error });
  }
});

// ====================================================================
//  DELETE CATEGORY
// ====================================================================
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    await StaffSalaryCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Error deleting category", error });
  }
});

// ====================================================================
//  FETCH STAFF + TRAINER ROLES (CORRECT VERSION)
// ====================================================================
router.get("/roles", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.query;
    if (!gymCode)
      return res.status(400).json({ message: "Gym code is required" });

    const approvals = await GymApproval.find({
      gymCode,
      status: "approved",
      clerkRole: { $in: ["staff", "trainer"] }, // ✔ correct role detection
    }).select("fullName clerkRole adminEmail _id"); // ✔ correct fields

    const users = approvals.map((u) => ({
      fullName: u.fullName,
      role: u.clerkRole,
      email: u.adminEmail,
      _id: u._id,
    }));

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("❌ Error fetching staff/trainer roles:", error);
    return res
      .status(500)
      .json({ message: "Error fetching staff/trainer list", error });
  }
});

// ====================================================================
//  ASSIGN SALARY
// ====================================================================
router.post("/assign-salary", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, role, fullName, staffEmail, staffId, salaryDetails } =
      req.body;

    if (
      !gymCode ||
      !role ||
      !fullName ||
      !staffEmail ||
      !staffId ||
      !Array.isArray(salaryDetails) ||
      !salaryDetails.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required salary assignment fields.",
      });
    }

    // Calculate total
    const totalAmount = salaryDetails.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );

    const newAssignment = new StaffSalaryAssignment({
      gymCode,
      role: role.toLowerCase(),
      fullName,
      salaryDetails,
      staffEmail: staffEmail.toLowerCase(),
      staffId,
      totalAmount,
      createdBy: req.clerkUser.sub,
      createdByEmail: req.clerkUser.email,
      createdByName: req.clerkUser.fullName,
    });

    await newAssignment.save();

    res.status(201).json({
      success: true,
      message: "Salary assigned successfully",
      data: newAssignment,
    });
  } catch (error) {
    console.error("❌ Error saving salary assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error saving salary assignment",
      error,
    });
  }
});

// ====================================================================
//  FETCH ASSIGNED SALARY
// ====================================================================
router.get("/assigned-salary", verifyClerkToken, async (req, res) => {
  try {
    let { gymCode, role, fullName } = req.query;

    role = role?.trim().toLowerCase();
    fullName = fullName?.trim();

    if (!gymCode || !role || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (gymCode, role, fullName)",
      });
    }

    const assignment = await StaffSalaryAssignment.findOne({
      gymCode,
      role,
      fullName,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No salary assignment found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: assignment.salaryDetails,
      totalAmount: assignment.totalAmount,
      assignmentId: assignment._id,
    });
  } catch (error) {
    console.error("❌ Error fetching assigned salary:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching salary",
      error: error.message,
    });
  }
});

// ====================================================================
//  UPDATE SALARY
// ====================================================================
router.put("/update-salary/:id", verifyClerkToken, async (req, res) => {
  try {
    const { salaryDetails } = req.body;

    if (!Array.isArray(salaryDetails))
      return res.status(400).json({
        success: false,
        message: "salaryDetails must be an array",
      });

    const updatedItem = salaryDetails[0]; // we always send only ONE edited item
    const assignment = await StaffSalaryAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // 🔥 MERGE LOGIC — DO NOT REPLACE WHOLE ARRAY
    let existing = assignment.salaryDetails;

    const index = existing.findIndex(
      (i) => i.salaryCategory === updatedItem.salaryCategory
    );

    if (index !== -1) {
      // update amount
      existing[index].amount = updatedItem.amount;
    } else {
      // category didn't exist — add it
      existing.push(updatedItem);
    }

    // update back
    assignment.salaryDetails = existing;

    // recalc total
    assignment.totalAmount = existing.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0
    );

    const saved = await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Salary updated",
      data: saved.salaryDetails,
      totalAmount: saved.totalAmount,
    });
  } catch (error) {
    console.error("❌ Error updating salary:", error);
    res.status(500).json({
      success: false,
      message: "Error updating salary",
      error: error.message,
    });
  }
});

// ====================================================================
//  DELETE SALARY ASSIGNMENT
// ====================================================================
router.delete(
  "/delete-salary/:id/:category",
  verifyClerkToken,
  async (req, res) => {
    try {
      const { id, category } = req.params;

      const assignment = await StaffSalaryAssignment.findById(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Filter out the category to delete
      const updated = assignment.salaryDetails.filter(
        (s) => s.salaryCategory !== category
      );

      // Case 1: No items left → delete assignment completely
      if (updated.length === 0) {
        await StaffSalaryAssignment.findByIdAndDelete(id);
        return res.status(200).json({
          success: true,
          message: "All salary categories removed. Assignment deleted.",
        });
      }

      // Case 2: Update the array
      assignment.salaryDetails = updated;
      assignment.totalAmount = updated.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      await assignment.save();

      res.status(200).json({
        success: true,
        message: "Salary category removed successfully.",
        data: updated,
        totalAmount: assignment.totalAmount,
      });
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting category",
        error: error.message,
      });
    }
  }
);

// ====================================================================
//  SALARY + ATTENDANCE MERGED
// ====================================================================
// ====================================================================
//  SALARY + ATTENDANCE MERGED + SAVE MONTHLY SUMMARY
// ====================================================================
router.get("/salary-with-attendance", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, date, role } = req.query;
    if (!gymCode)
      return res
        .status(400)
        .json({ success: false, message: "Gym code required" });

    const targetDate = date ? new Date(date) : new Date();
    const month = targetDate.getMonth() + 1; // ✔ human readable month
    const year = targetDate.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const query = { gymCode };
    if (role) query.role = role.toLowerCase();

    const salaryAssignments = await StaffSalaryAssignment.find(query).select(
      "fullName role totalAmount staffEmail"
    );

    const attendanceDocs = await StaffAttendance.find({
      gymCode,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    // Build attendance summary
    const attendanceSummary = {};
    attendanceDocs.forEach((doc) => {
      (doc.attendance || []).forEach((record) => {
        const email = record.staffEmail?.toLowerCase();
        if (!email) return;

        if (!attendanceSummary[email]) {
          attendanceSummary[email] = {
            Present: 0,
            Absent: 0,
            Leave: 0,
            "Half Day": 0,
            "Casual Leave": 0,
            "Sick Leave": 0,
          };
        }

        if (attendanceSummary[email][record.status] !== undefined) {
          attendanceSummary[email][record.status]++;
        }
      });
    });

    // MAIN MERGE LOOP + SAVE TO DB
    const combined = await Promise.all(
      salaryAssignments.map(async (s) => {
        const summary = attendanceSummary[s.staffEmail?.toLowerCase()] || {
          Present: 0,
          Absent: 0,
          Leave: 0,
          "Half Day": 0,
          "Casual Leave": 0,
          "Sick Leave": 0,
        };

        const absent = summary.Absent || 0;
        const grossSalary = Number(s.totalAmount || 0);
        const perDay = grossSalary / 30;
        const deducted = Number((perDay * absent).toFixed(2));
        const netSalary = Number((grossSalary - deducted).toFixed(2));

        const totalDays =
          summary.Present +
          summary.Absent +
          summary.Leave +
          summary["Half Day"] +
          summary["Casual Leave"] +
          summary["Sick Leave"];

        // ⬇️ SAVE MONTHLY SUMMARY TO DB
        await StaffMonthlySalary.findOneAndUpdate(
          {
            staffEmail: s.staffEmail.toLowerCase(),
            year,
            month,
          },
          {
            staffEmail: s.staffEmail.toLowerCase(),
            fullName: s.fullName,
            role: s.role,
            gymCode,

            year,
            month,

            present: summary.Present,
            absent: summary.Absent,
            leave: summary.Leave,
            halfDay: summary["Half Day"],
            casualLeave: summary["Casual Leave"],
            sickLeave: summary["Sick Leave"],
            totalDays,

            grossSalary,
            deducted,
            netSalary,
          },
          { upsert: true, new: true }
        );

        return {
          fullName: s.fullName,
          role: s.role,
          staffEmail: s.staffEmail,
          totalAmount: grossSalary,
          attendance: summary,
          deducted,
          netSalary,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (error) {
    console.error("❌ Salary-with-attendance error:", error);
    res.status(500).json({ success: false, message: "Error", error });
  }
});

// ====================================================================
//  DAILY ATTENDANCE GRID (P / A / NA FOR EACH DAY)
// ====================================================================
router.get("/salary-attendance-daily", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, date, role } = req.query;

    if (!gymCode)
      return res
        .status(400)
        .json({ success: false, message: "Gym code missing" });

    const target = date ? new Date(date) : new Date();
    const month = target.getMonth() + 1; // 1–12 (store human readable)
    const year = target.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    // -------------------------------------------------------
    // FETCH salary assignments
    // -------------------------------------------------------
    const salaryAssignments = await StaffSalaryAssignment.find({
      gymCode,
      role: role?.toLowerCase(),
    }).select("fullName role staffEmail totalAmount");

    // -------------------------------------------------------
    // FETCH daily attendance records
    // -------------------------------------------------------
    const attendanceRecords = await StaffAttendance.find({
      gymCode,
      date: {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month - 1, daysInMonth, 23, 59, 59),
      },
    }).lean();

    // -------------------------------------------------------
    // FETCH monthly salary summary (deducted + netSalary)
    // -------------------------------------------------------
    const monthlySummaries = await StaffMonthlySalary.find({
      gymCode,
      month,
      year,
    }).lean();

    const summaryMap = {}; // email → summary
    monthlySummaries.forEach((m) => {
      summaryMap[m.staffEmail.toLowerCase()] = m;
    });

    // -------------------------------------------------------
    // BUILD DAILY GRID
    // -------------------------------------------------------
    const dailyMap = {}; // email → {1:"P",2:"A",...}

    salaryAssignments.forEach((s) => {
      const email = s.staffEmail.toLowerCase();
      dailyMap[email] = {};

      for (let d = 1; d <= daysInMonth; d++) {
        dailyMap[email][d] = "NA"; // default
      }
    });

    // Fill attendance
    attendanceRecords.forEach((rec) => {
      const day = new Date(rec.date).getDate();

      (rec.attendance || []).forEach((a) => {
        const email = a.staffEmail?.toLowerCase();
        if (!email || !dailyMap[email]) return;

        dailyMap[email][day] = a.status === "Present" ? "P" : "A";
      });
    });

    // -------------------------------------------------------
    // FINAL COMBINED RESPONSE
    // -------------------------------------------------------
    const result = salaryAssignments.map((s) => {
      const email = s.staffEmail.toLowerCase();
      const summary = summaryMap[email] || {};

      return {
        fullName: s.fullName,
        role: s.role,
        salary: s.totalAmount,

        // ⭐ NEW FIELDS
        deducted: summary.deducted ?? 0,
        netSalary: summary.netSalary ?? s.totalAmount,

        // Daily grid
        daily: dailyMap[email] || {},
      };
    });

    return res.status(200).json({
      success: true,
      daysInMonth,
      data: result,
    });
  } catch (err) {
    console.error("❌ Daily attendance error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
