const express = require("express");
const router = express.Router();
const verifyClerkToken = require("../middleware/verifyClerkToken");
const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");

/* ---------------------- Create a New Expense ---------------------- */
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const {
      gymCode,
      expenseCategory,
      expenseDetail,
      amount,
      paymentMode,
      date,
      transactionId,
      description,
    } = req.body;

    if (!gymCode || !expenseCategory || !amount || !date || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const createdBy = req.user?.email || "unknown";

    const expense = await Expense.create({
      gymCode,
      expenseCategory,
      expenseDetail,
      amount,
      paymentMode,
      date,
      transactionId,
      description,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Expense added successfully!",
      expense,
    });
  } catch (error) {
    console.error("❌ Error creating expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating expense" });
  }
});

/* ---------------------- Get All Expenses ---------------------- */
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.query;

    if (!gymCode) {
      return res
        .status(400)
        .json({ success: false, message: "Gym code required" });
    }

    const expenses = await Expense.find({ gymCode }).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    console.error("❌ Error fetching expenses:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching expenses" });
  }
});

/* ---------------------- Expense Categories ---------------------- */

/* ✅ Create a new Expense Category */
router.post("/category", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, name } = req.body;
    if (!gymCode || !name)
      return res.status(400).json({
        success: false,
        message: "Gym code and category name required",
      });

    const createdBy = req.user?.email || "unknown";
    const category = await ExpenseCategory.create({ gymCode, name, createdBy });

    res.status(201).json({
      success: true,
      message: "Category created successfully!",
      category,
    });
  } catch (error) {
    console.error("❌ Error creating category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating expense category" });
  }
});

/* ✅ Get all categories by gymCode */
router.get("/category", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.query;
    if (!gymCode)
      return res
        .status(400)
        .json({ success: false, message: "Gym code required" });

    const categories = await ExpenseCategory.find({ gymCode }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching categories" });
  }
});
router.put("/category/:id", verifyClerkToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });

    const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    if (!updatedCategory)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    res.json({
      success: true,
      message: "Category updated successfully!",
      updatedCategory,
    });
  } catch (error) {
    console.error("❌ Error updating category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating category" });
  }
});

/* ✅ Delete a category */
router.delete("/category/:id", verifyClerkToken, async (req, res) => {
  try {
    const deletedCategory = await ExpenseCategory.findByIdAndDelete(
      req.params.id
    );
    if (!deletedCategory)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting category" });
  }
});

/* ---------------------- Get Single Expense ---------------------- */
/* ---------------------- Get Monthly or Yearly Expense Summary ---------------------- */
router.get("/summary", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, year, month, mode = "year" } = req.query; // mode: 'year' or 'month'

    if (!gymCode || !year) {
      return res.status(400).json({
        success: false,
        message: "Gym code and year are required",
      });
    }

    // ------------------ 🗓 YEARLY VIEW ------------------
    // ------------------ 🗓 YEARLY VIEW (Jan–Dec) ------------------
    if (mode === "year") {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);

      const expenses = await Expense.find({
        gymCode,
        date: { $gte: start, $lte: end },
      });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].map((m) => `${m} ${year.toString().slice(-2)}`);

      const summary = {};

      for (const exp of expenses) {
        const category = exp.expenseCategory || "Uncategorized";
        const expDate = new Date(exp.date);
        const monthIndex = expDate.getMonth(); // 0-11
        const monthKey = `${months[monthIndex]}`;

        if (!summary[category]) {
          summary[category] = {};
          months.forEach((m) => (summary[category][m] = 0));
          summary[category]["Total"] = 0;
        }

        summary[category][monthKey] += exp.amount;
        summary[category]["Total"] += exp.amount;
      }

      return res.json({ success: true, view: "year", summary });
    }

    // ------------------ 📅 MONTHLY VIEW ------------------
    if (mode === "month") {
      if (!month) {
        return res.status(400).json({
          success: false,
          message: "Month is required for monthly view (0–11).",
        });
      }

      // Month = 0-based index (0 = Jan, 11 = Dec)
      const start = new Date(year, month, 1);
      const end = new Date(year, parseInt(month) + 1, 0); // end of that month

      const expenses = await Expense.find({
        gymCode,
        date: { $gte: start, $lte: end },
      });

      const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();

      const summary = {};

      for (const exp of expenses) {
        const category = exp.expenseCategory || "Uncategorized";
        const expDate = new Date(exp.date);
        const day = expDate.getDate();

        if (!summary[category]) {
          summary[category] = {};
          for (let d = 1; d <= daysInMonth; d++) {
            summary[category][d] = 0;
          }
          summary[category]["Total"] = 0;
        }

        summary[category][day] += exp.amount;
        summary[category]["Total"] += exp.amount;
      }

      return res.json({ success: true, view: "month", summary });
    }

    // ------------------ Default (Invalid Mode) ------------------
    res.status(400).json({
      success: false,
      message: "Invalid mode parameter. Use 'month' or 'year'.",
    });
  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expense summary",
    });
  }
});

/* ---------------------- Get Yearly Expense Summary by Payment Mode ---------------------- */
router.get("/payment-summary", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, year } = req.query;

    if (!gymCode || !year) {
      return res.status(400).json({
        success: false,
        message: "Gym code and year are required",
      });
    }

    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31`);

    const expenses = await Expense.find({
      gymCode,
      date: { $gte: start, $lte: end },
    });

    // Payment modes we expect
    const paymentModes = ["Cash", "Card", "Online", "UPI", "Cheque", "Other"];

    // Build monthly summary
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].map((m) => `${m} ${year.toString().slice(-2)}`);

    const summary = {};

    // Initialize summary structure
    for (const mode of paymentModes) {
      summary[mode] = {};
      months.forEach((m) => (summary[mode][m] = 0));
      summary[mode]["Total"] = 0;
    }

    // Fill data
    for (const exp of expenses) {
      const mode = exp.paymentMode || "Other";
      const expDate = new Date(exp.date);
      const monthIndex = expDate.getMonth(); // 0–11
      const monthKey = `${months[monthIndex]}`;

      if (!summary[mode]) {
        summary[mode] = {};
        months.forEach((m) => (summary[mode][m] = 0));
        summary[mode]["Total"] = 0;
      }

      summary[mode][monthKey] += exp.amount;
      summary[mode]["Total"] += exp.amount;
    }

    return res.json({ success: true, summary });
  } catch (error) {
    console.error("❌ Error fetching payment summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary",
    });
  }
});

/* ---------------------- Get Single Expense ---------------------- */
router.get("/:id", verifyClerkToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({ success: true, expense });
  } catch (error) {
    console.error("❌ Error fetching expense:", error);
    res.status(500).json({ success: false, message: "Error fetching expense" });
  }
});

/* ---------------------- Update Expense ---------------------- */
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedExpense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({
      success: true,
      message: "Expense updated successfully",
      updatedExpense,
    });
  } catch (error) {
    console.error("❌ Error updating expense:", error);
    res.status(500).json({ success: false, message: "Error updating expense" });
  }
});

/* ---------------------- Delete Expense ---------------------- */
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting expense:", error);
    res.status(500).json({ success: false, message: "Error deleting expense" });
  }
});

/* ---------------------- Get Monthly Expense Summary ---------------------- */

module.exports = router;
