// const express = require("express");
// const router = express.Router();
// const CheckIn = require("../models/CheckIn");

// // GET /api/attendance?date=YYYY-MM-DD&search=...
// router.get("/", async (req, res) => {
//   const { date, search = "" } = req.query;

//   try {
//     const records = await CheckIn.find({
//       date,
//       memberName: { $regex: search, $options: "i" },
//     });

//     const checkInsToday = records.length;
//     const currentlyInside = records.filter((r) => !r.checkOutTime).length;
//     const avgStayTime =
//       records.reduce((total, r) => {
//         if (r.checkOutTime) {
//           const minutes = (new Date(r.checkOutTime) - new Date(r.checkInTime)) / (1000 * 60);
//           return total + minutes;
//         }
//         return total;
//       }, 0) / (records.filter((r) => r.checkOutTime).length || 1);

//     const peakHour = "6:00–7:00 PM"; // Optional: Replace with logic later

//     res.json({
//       checkInsToday,
//       currentlyInside,
//       avgStayTime: `${Math.round(avgStayTime)} min`,
//       peakHour,
//       records,
//     });
//   } catch (error) {
//     console.error("Error fetching attendance:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const verifyClerkToken = require("../middleware/verifyClerkToken");

/* -------------------------------------------------------------------------- */
/*                         ATTENDANCE ROUTES USING USERID                     */
/* -------------------------------------------------------------------------- */

// ✅ GET all attendance records filtered by date, category, and gymId (user-specific)
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const { date, category, gymId } = req.query;
    const userId = req.clerkUser?.sub;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const filter = { userId };
    if (gymId) filter.gymId = gymId;
    if (date) filter.date = date;
    if (category) filter.category = category;

    const records = await Attendance.find(filter).sort({ time: -1 });
    res.json(records);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// ✅ POST new attendance record (user-specific)
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { status, date, category, gymId } = req.body;

    if (!status || !date || !category || !gymId) {
      return res.status(400).json({
        error: "status, date, category, and gymId are required",
      });
    }

    const newAttendance = new Attendance({
      userId, // from token
      status,
      date,
      category,
      gymId,
      time: new Date(),
    });

    const saved = await newAttendance.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Failed to save attendance" });
  }
});

// ✅ PUT update attendance record (user-specific)
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { status, date, category, gymId } = req.body;
    if (!status || !date || !category || !gymId) {
      return res.status(400).json({
        error: "status, date, category, and gymId are required",
      });
    }

    const updated = await Attendance.findOneAndUpdate(
      { _id: req.params.id, userId }, // ensure user can only update their own record
      { status, date, category, gymId, time: new Date() },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ error: "Attendance not found" });

    res.json(updated);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Failed to update attendance" });
  }
});

// ✅ DELETE attendance record (user-specific)
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const deleted = await Attendance.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!deleted)
      return res.status(404).json({ error: "Attendance not found" });

    res.json({ message: "Attendance deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete attendance" });
  }
});

// ✅ GET all attendance for logged-in user and optional gymId
router.get("/my", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { gymId } = req.query;
    const filter = { userId };
    if (gymId) filter.gymId = gymId;

    const records = await Attendance.find(filter).sort({ time: -1 });
    res.json(records);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch user attendance" });
  }
});

module.exports = router;
