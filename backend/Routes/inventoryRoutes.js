const express = require("express");
const Inventory = require("../models/Inventory");
const GymApproval = require("../models/GymApproval");

const router = express.Router();

// =============================
// GET ITEMS BY GYM CODE
// =============================
router.get("/by-gym", async (req, res) => {
  try {
    const { gymCode } = req.query;

    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "gymCode is required",
      });
    }

    // Validate approved gym
    const gym = await GymApproval.findOne({ gymCode, status: "approved" });
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unapproved gymCode",
      });
    }

    const items = await Inventory.find({ gymCode });
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =============================
// ADD INVENTORY ITEM
// =============================
router.post("/", async (req, res) => {
  try {
    const { gymCode } = req.body;

    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "gymCode is required",
      });
    }

    // Validate gymCode
    const gym = await GymApproval.findOne({ gymCode, status: "approved" });
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Invalid gymCode",
      });
    }

    const item = await Inventory.create(req.body);

    res.json({ success: true, message: "Item added", item });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =============================
// UPDATE ITEM
// =============================
router.put("/:id", async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ success: true, message: "Item updated", item });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =============================
// DELETE ITEM
// =============================
router.delete("/:id", async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
