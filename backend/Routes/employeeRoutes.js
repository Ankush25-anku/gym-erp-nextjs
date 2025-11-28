// routes/employeeRoutes.js
const express = require("express");
const Employee = require("../models/Employee");
const verifyClerkToken = require("../middleware/verifyClerkToken");

const router = express.Router();

// Register Employee
// ✅ Register Employee (Clerk userId stored automatically)
router.post("/register", verifyClerkToken, async (req, res) => {
  try {
    const {
      department,
      position,
      phone,
      fullName,
      requestAdminAccess,
      profileImage,
      role,
    } = req.body;

    const clerkUserId = req.clerkUser.sub;
    const createdBy = req.clerkUser.sub; // same owner key
    const userId = req.clerkUser.id; // ✅ Clerk userId from token

    // ✅ Find employee using Clerk userId + owner filter
    let employee = await Employee.findOne({
      userId,
      createdBy,
    });

    if (employee) {
      employee.set({
        fullName,
        phone,
        department,
        position,
        requestAdminAccess,
        profileImage,
        role,
      });
      await employee.save();

      return res.status(200).json({
        message: "Employee updated",
        employee,
      });
    }

    // ✅ Create new employee with auto-inserted userId
    employee = new Employee({
      userId, // ✅ saved automatically
      fullName,
      email,
      phone,
      department,
      position,
      profileImage,
      requestAdminAccess,
      role,
      createdBy,
    });

    await employee.save();

    res.status(201).json({
      message: "Employee registered successfully",
      employee,
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Server error while registering employee" });
  }
});

// ✅ Get employees for logged-in owner
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const employees = await Employee.find({
      createdBy: req.clerkUser.sub,
    }).sort({ createdAt: -1 });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching employees" });
  }
});
// Update Employee
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndUpdate(
      { _id: id, createdBy: req.clerkUser.sub },
      req.body,
      { new: true }
    );

    if (!employee) {
      return res
        .status(404)
        .json({ error: "Employee not found or unauthorized" });
    }

    res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    console.error("❌ Error updating employee:", error);
    res.status(500).json({ error: "Server error while updating employee" });
  }
});

// Delete Employee
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndDelete({
      _id: id,
      createdBy: req.clerkUser.sub,
    });

    if (!employee) {
      return res
        .status(404)
        .json({ error: "Employee not found or unauthorized" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting employee:", error);
    res.status(500).json({ error: "Server error while deleting employee" });
  }
});

module.exports = router;
