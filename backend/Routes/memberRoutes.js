// const express = require('express');
// const router = express.Router();
// const Member = require('../models/Member');
// const mongoose = require('mongoose');
// const Expense = require('../models/Expense'); // ✅ Add this line

// // IF the file is named auth.js instead of authMiddleware.js
// const protect = require('../middleware/auth'); // ✅ adjust path
//  // ✅ Import protect middleware

// // 💡 Utility: Revenue based on plan type
// const getPlanPrice = (plan) => {
//   switch (plan) {
//     case "Basic":
//       return 1000;
//     case "Premium":
//       return 6000;
//     case "VIP":
//       return 12000;
//     default:
//       return 0;
//   }
// };

// router.post('/', protect, async (req, res) => {
//   try {
//     const newMember = new Member({
//       fullname: req.body.fullname,
//       email: req.body.email,
//       phone: req.body.phone,
//       plan: req.body.plan,
//       address: req.body.address,
//       expires: req.body.expires,
//       status: req.body.status,
//       joined: req.body.joined,
//       initials: req.body.initials,
//       image: req.body.image || "",
//       role: req.body.role || "member",
//       emergency: req.body.emergency || {},
//       health: req.body.health || {},
//       gymId: req.body.gymId || null,

//       // ✅ Fix: these were missing!
//       createdBy: req.user.id,
//       userEmail: req.user.email,
//     });

//     const saved = await newMember.save();
//     res.status(201).json(saved);
//   } catch (error) {
//     console.error('❌ POST Error:', error);
//     res.status(500).json({ message: 'Error creating member', error: error.message });
//   }
// });

// // ✅ Get All Members (only for logged-in user)
// router.get("/", protect, async (req, res) => {
//   try {
//     const { gymId } = req.query;
//     const filter = {};

//     // ✅ Always filter by userEmail
//     filter.userEmail = req.user.email;

//     // ✅ If gymId is provided and not "all", filter using ObjectId
//     if (gymId && gymId !== "all") {
//       filter.gymId = new mongoose.Types.ObjectId(gymId);
//     }

//     const members = await Member.find(filter).populate("gymId", "name");
//     res.json(members);
//   } catch (err) {
//     console.error("❌ Member fetch failed:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Update Member
// router.put('/:id', protect, async (req, res) => {
//   try {
//     const memberId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(memberId)) {
//       return res.status(400).json({ error: "Invalid member ID format" });
//     }

//     const {
//       fullname,
//       email,
//       phone,
//       plan,
//       address,
//       expires,
//       status,
//       joined,
//       initials,
//       image,
//       role,
//       emergency = {},
//       health = {},
//       gymId
//     } = req.body;

//     if (gymId && !mongoose.Types.ObjectId.isValid(gymId)) {
//       return res.status(400).json({ error: "Invalid gymId format" });
//     }

//     if (joined && isNaN(Date.parse(joined))) {
//       return res.status(400).json({ error: "Invalid joined date format" });
//     }
//     if (expires && isNaN(Date.parse(expires))) {
//       return res.status(400).json({ error: "Invalid expiry date format" });
//     }

//     const updated = await Member.findOneAndUpdate(
//       { _id: memberId, createdBy: req.user.id }, // ✅ Only allow updates to user's own members
//       {
//         fullname,
//         email,
//         phone,
//         plan,
//         address,
//         expires,
//         status,
//         joined,
//         initials,
//         image,
//         role,
//         emergency,
//         health,
//         gymId: gymId || null,
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ error: "Member not found or not authorized" });
//     }

//     res.json(updated);
//   } catch (err) {
//     console.error("Update member error:", err);
//     res.status(500).json({ error: "Failed to update member" });
//   }
// });

// // ✅ Delete Member
// router.delete('/:id', protect, async (req, res) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: 'Invalid member ID format' });
//   }

//   try {
//     const deleted = await Member.findOneAndDelete({ _id: id, createdBy: req.user.id }); // ✅ Only delete if owned
//     if (!deleted) {
//       return res.status(404).json({ message: 'Member not found or not authorized' });
//     }

//     res.status(200).json({ message: 'Member deleted successfully' });
//   } catch (error) {
//     console.error('Delete Error:', error.message || error);
//     res.status(500).json({ message: 'Internal Server Error', error: error.message });
//   }
// });

// // ✅ Get Total Revenue (user-specific)
// // ✅ Get Total Revenue (user-specific)
// router.get("/revenue", protect, async (req, res) => {
//   try {
//     const members = await Member.find({ createdBy: req.user.id }, "plan");

//     let totalRevenue = 0;

//     for (const member of members) {
//       const planPrice = getPlanPrice(member.plan); // ✅ FIXED
//       totalRevenue += planPrice;
//     }

//     res.json({ totalRevenue });
//   } catch (err) {
//     console.error("Failed to calculate member revenue:", err);
//     res.status(500).json({ message: "Error fetching member revenue" });
//   }
// });

// // ✅ Revenue breakdown by month (user-specific)
// router.get("/revenue/breakdown", protect, async (req, res) => {
//   try {
//     const { gymId } = req.query;

//     let filter = {};

//     // 🟢 Fix: If gymId is "all", skip filtering by gymId
//     if (gymId && gymId !== "all") {
//       filter.gymId = gymId;
//     } else if (!gymId || gymId === "all") {
//   // No filter — include all gyms
//   filter = {}; // ← this is the fix
// }

//     const members = await Member.find(filter);

//     // 🔍 DEBUG LOGS: Log members
//     console.log("🔍 Members found:", members.length);
//     console.log("👀 First few members:", members.slice(0, 5));

//     const revenueByMonth = {};
//     members.forEach((member) => {
//       // 📅 Log individual member data
//       console.log("📅 Member joined:", member.joined, " | Plan:", member.plan);

//       if (!member.joined || !member.plan) return;

//       const date = new Date(member.joined);
//       const monthShort = date.toLocaleString("default", { month: "short" });

//       const planPrice = getPlanPrice(member.plan);
//       revenueByMonth[monthShort] = (revenueByMonth[monthShort] || 0) + planPrice;
//     });

//     const expenses = await Expense.find(filter); // Make sure Expense is imported!

//     const expenseByMonth = {};
//     expenses.forEach((expense) => {
//       if (!expense.date || isNaN(new Date(expense.date))) return;
//       const date = new Date(expense.date);
//       const monthShort = date.toLocaleString("default", { month: "short" });

//       expenseByMonth[monthShort] = (expenseByMonth[monthShort] || 0) + expense.amount;
//     });

//     const months = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//     ];

//     const monthlyRevenue = months.map((month) => ({
//       month,
//       total: revenueByMonth[month] || 0,
//     }));

//     const monthlyExpense = months.map((month) => ({
//       month,
//       total: expenseByMonth[month] || 0,
//     }));

//     return res.json({ monthlyRevenue, monthlyExpense });
//   } catch (err) {
//     console.error("❌ Error generating revenue breakdown:", err);
//     res.status(500).json({ error: "Failed to generate revenue/expense breakdown" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Member = require("../models/Member");
const Expense = require("../models/Expense");
const verifyClerkToken = require("../middleware/verifyClerkToken");

// 💡 Utility: Revenue based on plan type
const getPlanPrice = (plan) => {
  switch (plan) {
    case "Basic":
      return 1000;
    case "Premium":
      return 6000;
    case "VIP":
      return 12000;
    default:
      return 0;
  }
};

/* -------------------------- Create Member -------------------------- */
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    const { clerkUser } = req;

    const newMember = new Member({
      fullname: req.body.fullname,
      email: req.body.email,
      phone: req.body.phone,
      plan: req.body.plan,
      address: req.body.address,
      expires: req.body.expires,
      status: req.body.status,
      joined: req.body.joined,
      initials: req.body.initials,
      image: req.body.image || "",
      role: req.body.role || "member",
      emergency: req.body.emergency || {},
      health: req.body.health || {},
      gymId: req.body.gymId || null,

      userId: clerkUser.sub, // ✅ Use Clerk user ID
      userEmail: clerkUser.email, // ✅ Use Clerk email
    });

    const saved = await newMember.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("❌ POST Error:", error);
    res
      .status(500)
      .json({ message: "Error creating member", error: error.message });
  }
});

/* -------------------------- Get Members -------------------------- */
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const { gymId } = req.query;
    const { clerkUser } = req;

    const filter = { userId: clerkUser.sub };

    if (gymId && gymId !== "all") {
      if (mongoose.Types.ObjectId.isValid(gymId)) {
        filter.gymId = new mongoose.Types.ObjectId(gymId);
      } else {
        return res.status(400).json({ error: "Invalid gymId" });
      }
    }

    console.log("🔍 Fetching members with filter:", filter);

    const members = await Member.find(filter).populate("gymId", "name");

    if (members.length === 0) {
      console.warn("⚠️ No members found for this user.");
    }

    res.json(members);
  } catch (err) {
    console.error("❌ Member fetch failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------- Update Member -------------------------- */
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const { clerkUser } = req;
    const memberId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ error: "Invalid member ID format" });
    }

    const {
      fullname,
      email,
      phone,
      plan,
      address,
      expires,
      status,
      joined,
      initials,
      image,
      role,
      emergency = {},
      health = {},
      gymId,
    } = req.body;

    if (gymId && !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ error: "Invalid gymId format" });
    }

    const updated = await Member.findOneAndUpdate(
      { _id: memberId, userId: clerkUser.sub },
      {
        fullname,
        email,
        phone,
        plan,
        address,
        expires,
        status,
        joined,
        initials,
        image,
        role,
        emergency,
        health,
        gymId: gymId || null,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Member not found or not authorized" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update member error:", err);
    res.status(500).json({ error: "Failed to update member" });
  }
});

/* -------------------------- Delete Member -------------------------- */
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    const { clerkUser } = req;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member ID format" });
    }

    const deleted = await Member.findOneAndDelete({
      _id: id,
      userId: clerkUser.sub,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Member not found or not authorized" });
    }

    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error.message || error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

/* -------------------------- Total Revenue -------------------------- */
router.get("/revenue", verifyClerkToken, async (req, res) => {
  try {
    const { clerkUser } = req;
    const members = await Member.find({ createdBy: clerkUser.sub }, "plan");

    let totalRevenue = 0;
    members.forEach((member) => {
      totalRevenue += getPlanPrice(member.plan);
    });

    res.json({ totalRevenue });
  } catch (err) {
    console.error("Failed to calculate member revenue:", err);
    res.status(500).json({ message: "Error fetching member revenue" });
  }
});

/* -------------------------- Revenue & Expense Breakdown -------------------------- */
router.get("/revenue/breakdown", verifyClerkToken, async (req, res) => {
  try {
    const { clerkUser } = req;
    const { gymId } = req.query;

    const filter = { createdBy: clerkUser.sub };
    if (gymId && gymId !== "all") filter.gymId = gymId;

    const members = await Member.find(filter);
    const revenueByMonth = {};

    members.forEach((member) => {
      if (!member.joined || !member.plan) return;
      const date = new Date(member.joined);
      const monthShort = date.toLocaleString("default", { month: "short" });
      revenueByMonth[monthShort] =
        (revenueByMonth[monthShort] || 0) + getPlanPrice(member.plan);
    });

    const expenses = await Expense.find(filter);
    const expenseByMonth = {};
    expenses.forEach((expense) => {
      if (!expense.date || isNaN(new Date(expense.date))) return;
      const date = new Date(expense.date);
      const monthShort = date.toLocaleString("default", { month: "short" });
      expenseByMonth[monthShort] =
        (expenseByMonth[monthShort] || 0) + expense.amount;
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
    ];

    const monthlyRevenue = months.map((month) => ({
      month,
      total: revenueByMonth[month] || 0,
    }));
    const monthlyExpense = months.map((month) => ({
      month,
      total: expenseByMonth[month] || 0,
    }));

    res.json({ monthlyRevenue, monthlyExpense });
  } catch (err) {
    console.error("❌ Error generating revenue breakdown:", err);
    res
      .status(500)
      .json({ error: "Failed to generate revenue/expense breakdown" });
  }
});

module.exports = router;
