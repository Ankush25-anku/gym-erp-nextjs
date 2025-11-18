const express = require("express");
const router = express.Router();
const AdminStaffAttendance = require("../models/adminstaffattendance");
const Staff = require("../models/Staff");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const mongoose = require("mongoose");

/* -------------------------------------------------------------------------- */
/*                               STAFF LIST API                               */
/* -------------------------------------------------------------------------- */
// ✅ GET /api/adminstaff/list - Staff list by gymId
router.get("/list", verifyClerkToken, async (req, res) => {
  try {
    const { gymId } = req.query;

    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ error: "Valid gymId is required" });
    }

    const staffList = await Staff.find({ gymId });
    res.json(staffList);
  } catch (err) {
    console.error("❌ Failed to fetch staff by gymId:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                           ATTENDANCE CRUD APIS                             */
/* -------------------------------------------------------------------------- */
// ✅ GET /api/adminstaff - Attendance list by userEmail (from token) & gymId
// ✅ POST /api/adminstaff - Create new attendance record
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const { name, email, phone = "", position = "", status, gymId } = req.body;

    // Fetch logged-in user's email and sub (userId) from Clerk token
    const userEmail = req.clerkUser?.email;
    const userId = req.clerkUser?.sub;

    // Validate required fields
    if (!userEmail || !userId || !gymId || !name || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ error: "Invalid gymId" });
    }

    // ✅ Ensure status matches the enum exactly
    const validStatus = ["Present", "Absent"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be ${validStatus.join(" or ")}.`,
      });
    }

    const newStaff = new Staff({
      userEmail, // Clerk email
      userId, // Clerk sub
      name,
      email,
      phone,
      position,
      status,
      gymId,
    });

    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (err) {
    console.error("❌ Error creating staff:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ GET /api/adminstaff - Attendance list by logged-in user & optional gymId
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub; // Clerk userId
    const { gymId } = req.query;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const filter = { userId }; // filter by logged-in user

    // filter by gymId if provided
    if (gymId && mongoose.Types.ObjectId.isValid(gymId)) {
      filter.gymId = gymId;
    }

    const staffList = await Staff.find(filter).sort({
      createdAt: -1, // latest added staff first
    });

    res.json(staffList);
  } catch (err) {
    console.error("❌ Error fetching staff:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ POST /api/adminstaff - Create new attendance record
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const { name, email, phone = "", position = "", status, gymId } = req.body;

    const userEmail = req.clerkUser?.email;

    // Validate required fields
    if (!userEmail || !gymId || !name || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ error: "Invalid gymId" });
    }

    // ✅ Ensure status matches the enum exactly
    const validStatus = ["Present", "Absent"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be ${validStatus.join(" or ")}.`,
      });
    }

    const newStaff = new Staff({
      userEmail,
      name,
      email,
      phone,
      position,
      status,
      gymId,
    });

    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (err) {
    console.error("❌ Error creating staff:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ PUT /api/adminstaff/:id - Update attendance record
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone = "",
      status,
      date,
      time,
      remarks = "",
      gymId,
    } = req.body;

    const userEmail = req.clerkUser?.email;

    if (!userEmail || !gymId) {
      return res
        .status(400)
        .json({ error: "userEmail and gymId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ error: "Invalid gymId" });
    }

    if (status && !["Present", "Absent"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be 'Present' or 'Absent'." });
    }

    const updated = await Staff.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        status,
        date,
        time,
        remarks,
        gymId,
        userEmail,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating attendance:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ DELETE /api/adminstaff/:id - Delete a record
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    await AdminStaffAttendance.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting attendance:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
