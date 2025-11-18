const express = require("express");
const router = express.Router();
const verifyClerkToken = require("../middleware/verifyClerkToken");
const GymApproval = require("../models/GymApproval");
const StaffAttendance = require("../models/StaffAttendance");
const Employee = require("../models/Employee");

// 🟢 GET staff list by gymCode
// 🟢 GET staff list by gymCode
router.get("/staff-list", verifyClerkToken, async (req, res) => {
  try {
    let { gymCode } = req.query;
    if (!gymCode)
      return res
        .status(400)
        .json({ success: false, message: "Missing gymCode" });

    gymCode = gymCode.trim().toUpperCase();
    const staff = await GymApproval.find({
      gymCode,
      role: { $regex: "^staff$", $options: "i" },
      status: { $regex: "^approved$", $options: "i" },
    })
      .select("fullName requesterEmail gymCode role status")
      .sort({ fullName: 1 });

    res.json({ success: true, staff });
  } catch (err) {
    console.error("❌ Error fetching staff:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 POST mark attendance
// 🟢 POST mark attendance
router.post("/mark-attendance", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, date, attendance } = req.body;
    const createdBy = req.clerkUser?.email || "unknown";

    if (!gymCode || !date || !attendance?.length) {
      return res.status(400).json({
        success: false,
        message: "Missing gymCode/date/attendance",
      });
    }

    const normalizedCode = gymCode.trim().toUpperCase();
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ Make sure we keep staffEmail when saving
    const processedAttendance = attendance.map((a) => ({
      staffId: a.staffId,
      staffEmail: a.staffEmail,
      status: a.status,
    }));

    let record = await StaffAttendance.findOne({
      gymCode: normalizedCode,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (record) {
      record.attendance = processedAttendance; // ✅ only set once
      record.createdBy = createdBy;
      await record.save();
      console.log("📝 Updated existing attendance for", normalizedCode);
      return res.json({
        success: true,
        message: "Attendance updated successfully",
      });
    }

    // ✅ Create new attendance document
    await StaffAttendance.create({
      gymCode: normalizedCode,
      date,
      createdBy,
      attendance: processedAttendance, // ✅ include staffEmail here too
    });

    console.log("✅ New attendance record saved by", createdBy);
    res.json({ success: true, message: "Attendance saved successfully" });
  } catch (err) {
    console.error("❌ Error saving attendance:", err);
    res.status(500).json({
      success: false,
      message: "Server error while saving attendance",
    });
  }
});

// 🟢 GET attendance by date
router.get("/fetch-attendance", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, date } = req.query;
    if (!gymCode || !date)
      return res
        .status(400)
        .json({ success: false, message: "Missing gymCode or date" });

    const normalizedCode = gymCode.trim().toUpperCase();
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await StaffAttendance.findOne({
      gymCode: normalizedCode,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!record) return res.json({ success: true, attendance: [] });
    res.json({ success: true, attendance: record.attendance });
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
    });
  }
});

// 🟢 PUT update attendance for a single staff
router.put("/update", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, staffId, date, status } = req.body;

    if (!gymCode || !staffId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (gymCode, staffId, date, status)",
      });
    }

    const normalizedGymCode = gymCode.trim().toUpperCase();
    const createdBy = req.clerkUser?.email || "unknown";

    // ✅ Find attendance record for this gym + date
    const record = await StaffAttendance.findOne({
      gymCode: normalizedGymCode,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999),
      },
    });

    if (!record) {
      // ❌ No record for that date → create new one
      const newAttendance = new StaffAttendance({
        gymCode: normalizedGymCode,
        date,
        attendance: [{ staffId, status }],
        createdBy,
      });
      await newAttendance.save();
      console.log("🆕 Created new attendance record for update:", staffId);
      return res.json({
        success: true,
        message: "Attendance record created successfully.",
      });
    }

    // ✅ If record exists, check if staff already has entry
    const existingEntry = record.attendance.find(
      (a) => a.staffId.toString() === staffId.toString()
    );

    if (existingEntry) {
      existingEntry.status = status;
      console.log(`✏️ Updated status for staff ${staffId} → ${status}`);
    } else {
      record.attendance.push({ staffId, status });
      console.log(`➕ Added new staff ${staffId} with status ${status}`);
    }

    record.createdBy = createdBy; // Track who updated
    await record.save();

    res.json({
      success: true,
      message: "Attendance updated successfully.",
    });
  } catch (err) {
    console.error("❌ Error updating attendance:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating attendance.",
    });
  }
});

// 🟢 GET monthly staff attendance by gymCode & month
// 🟢 GET monthly staff attendance by gymCode & month
// 🟢 GET monthly staff attendance by gymCode, month & year
router.get("/monthly", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, month, year } = req.query;

    if (!gymCode || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Missing gymCode, month, or year",
      });
    }

    // ✅ Define month range correctly (1st → last day)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // ✅ Fetch attendance within range, sorted by date ascending
    const records = await StaffAttendance.find({
      gymCode: gymCode.trim().toUpperCase(),
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .select("date attendance") // only return needed fields
      .lean();

    // ✅ Format response cleanly
    const formatted = records.map((r) => ({
      date: r.date,
      attendance: (r.attendance || []).map((a) => ({
        staffId: a.staffId?.toString(),
        staffEmail: a.staffEmail || "",
        status: a.status,
      })),
    }));

    res.json({ success: true, attendance: formatted });
  } catch (err) {
    console.error("❌ Error fetching monthly attendance:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching monthly attendance",
    });
  }
});

// 🟢 GET individual staff attendance (for calendar display)
// 🟢 GET individual staff attendance (for calendar display)
// 🟢 GET individual staff attendance (for calendar display)
// 🟢 GET individual staff attendance (for calendar display)
// ✅ GET individual staff attendance (for calendar display)
router.get("/staff-calendar", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, staffId, staffEmail, month, year } = req.query;

    console.log("📩 staff-calendar called with:", {
      gymCode,
      staffId,
      staffEmail,
      month,
      year,
    });

    if (!gymCode || (!staffId && !staffEmail)) {
      return res.status(400).json({
        success: false,
        message: "Missing gymCode or staff identifier (staffId/staffEmail)",
      });
    }

    // ✅ Step 1: Build date filter
    const filter = { gymCode: gymCode.trim().toUpperCase() };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await StaffAttendance.find(filter)
      .select("date attendance")
      .sort({ date: 1 })
      .lean();

    console.log(`🗓 Found ${records.length} attendance records for ${gymCode}`);

    // ✅ Step 2: Resolve staffId properly (GymApproval first)
    let effectiveStaffId = staffId;
    if (!effectiveStaffId && staffEmail) {
      console.log("🔍 Trying to resolve staffId from staffEmail:", staffEmail);

      const staffRecord =
        (await GymApproval.findOne({
          requesterEmail: staffEmail,
          role: { $regex: "^staff$", $options: "i" },
        }).select("_id")) ||
        (await Employee.findOne({ email: staffEmail }).select("_id"));

      if (staffRecord?._id) {
        effectiveStaffId = staffRecord._id.toString();
        console.log("✅ Resolved staffId:", effectiveStaffId);
      } else {
        console.warn("⚠️ No matching staff found for email:", staffEmail);
      }
    }

    // ✅ Step 3: Build calendarData (match by ID OR email)
    const calendarData = records.map((record) => {
      const staffEntry = record.attendance.find((a) => {
        const dbStaffId = a.staffId?.toString()?.trim();
        const queryStaffId = effectiveStaffId?.toString()?.trim();
        const dbEmail = a.staffEmail?.toLowerCase()?.trim();
        const queryEmail = staffEmail?.toLowerCase()?.trim();

        return dbStaffId === queryStaffId || dbEmail === queryEmail;
      });

      return {
        date: record.date,
        status: staffEntry ? staffEntry.status : "NA",
      };
    });

    console.log("✅ Final calendarData:", calendarData);

    res.json({ success: true, attendance: calendarData });
  } catch (err) {
    console.error("❌ Error fetching staff calendar attendance:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching staff calendar attendance",
    });
  }
});

// 🟢 GET /checked-in-count/:gymCode - Get number of staff checked in today
// 🟢 GET /checked-in-count/:gymCode - Count staff checked in today
router.get("/checked-in-count/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;
    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "Gym code is required",
      });
    }

    const normalizedCode = gymCode.trim().toUpperCase();

    // ✅ Define today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ Fetch today's attendance document
    const todayRecord = await StaffAttendance.findOne({
      gymCode: normalizedCode,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    if (!todayRecord || !todayRecord.attendance?.length) {
      console.log(`⚠️ No attendance found for gym ${normalizedCode} today`);
      return res.status(200).json({
        success: true,
        checkedInCount: 0,
        message: "No staff attendance record found for today",
      });
    }

    // ✅ Filter only "Present" / "Checkin" / "Checked In" statuses
    const checkedInCount = todayRecord.attendance.filter((entry) => {
      const status = entry.status?.toLowerCase()?.trim();
      return (
        status === "present" ||
        status === "checked in" ||
        status === "checkin" ||
        status === "on duty"
      );
    }).length;

    console.log(
      `✅ ${checkedInCount} staff checked in for gym ${normalizedCode} today`
    );

    res.status(200).json({
      success: true,
      gymCode: normalizedCode,
      checkedInCount,
    });
  } catch (err) {
    console.error("❌ Error fetching checked-in staff count:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching checked-in staff count",
      error: err.message,
    });
  }
});

module.exports = router;
