// backend/Routes/memberSubscriptionRoutes.js
console.log("✅ Member Subscription Routes Loaded");

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const MemberSubscriptionPayment = require("../models/MemberSubscriptionPayment");
const ClerkUser = require("../models/ClerkUser");
const GymApproval = require("../models/GymApproval");
const Razorpay = require("razorpay");

// ✅ Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Helper: calculate expiry date
function calculateExpiry(duration) {
  const now = new Date();
  if (duration.includes("1 Month"))
    return new Date(now.setMonth(now.getMonth() + 1));
  if (duration.includes("6 Months"))
    return new Date(now.setMonth(now.getMonth() + 6));
  if (duration.includes("12 Months"))
    return new Date(now.setFullYear(now.getFullYear() + 1));
  return now;
}

/**
 * ==============================================================
 * 🟢 POST /api/member-subscriptions/create-order
 * Create a Razorpay Order
 * ==============================================================
 */
router.post("/create-order", verifyClerkToken, async (req, res) => {
  try {
    const { amount, planName } = req.body;
    const userEmail = req.clerkUser?.email;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid Clerk token — email missing",
      });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { planName, userEmail },
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Error creating Razorpay order:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: err.message,
    });
  }
});

/**
 * ==============================================================
 * 🟢 POST /api/member-subscriptions/verify-payment
 * Verify Razorpay Payment Signature & Store Subscription
 * ==============================================================
 */
router.post("/verify-payment", verifyClerkToken, async (req, res) => {
  console.log("🟢 /verify-payment endpoint hit");
  console.log("Request body:", req.body);
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      duration,
      amount,
      description,
    } = req.body;

    const userEmail = req.clerkUser?.email;
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid Clerk token — email missing",
      });
    }

    // ✅ Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("❌ Payment verification failed: Invalid signature");
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    console.log("✅ Razorpay payment verified successfully!");

    // ✅ Fetch ClerkUser and GymApproval
    const clerkUser = await ClerkUser.findOne({ email: userEmail });
    const gymApproval = await GymApproval.findOne({
      requesterEmail: userEmail,
    });

    if (!clerkUser || !gymApproval) {
      console.error("❌ Missing ClerkUser or GymApproval:", {
        clerkUser,
        gymApproval,
      });
      return res
        .status(404)
        .json({ success: false, message: "User or GymApproval not found" });
    }

    const expiryDate = calculateExpiry(duration);

    // ✅ Log before save
    console.log("🧾 Saving subscription with data:", {
      memberId: clerkUser._id,
      gymCode: gymApproval.gymCode,
      role: gymApproval.role,
      email: userEmail,
      planName,
      duration,
      amount,
      paymentMethod: "Razorpay",
      description,
      expiryDate,
      transactionId: razorpay_payment_id,
    });

    // ✅ Save to DB
    const subscription = await MemberSubscriptionPayment.create({
      memberId: clerkUser._id,
      gymCode: gymApproval.gymCode,
      role: gymApproval.role,
      email: userEmail,
      planName,
      duration,
      amount,
      paymentMethod: "Razorpay",
      description,
      expiryDate,
      status: "Paid",
      transactionId: razorpay_payment_id,
    });

    console.log("✅ Payment stored in DB:", subscription._id);

    res.status(200).json({
      success: true,
      message: "Payment verified & subscription created successfully",
      subscription,
    });
  } catch (err) {
    console.error("❌ Error verifying payment:", err);
    res.status(500).json({
      success: false,
      message: "Server error during payment verification",
      error: err.message,
    });
  }
});

/**
 * ==============================================================
 * 🟢 GET /api/member-subscriptions
 * Fetch all subscriptions for the logged-in ClerkUser
 * ==============================================================
 */
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const userEmail = req.clerkUser?.email;
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid Clerk token — email not found",
      });
    }

    const clerkUser = await ClerkUser.findOne({ email: userEmail });
    if (!clerkUser) {
      return res.status(404).json({
        success: false,
        message: "ClerkUser not found",
      });
    }

    const gymApproval = await GymApproval.findOne({
      requesterEmail: userEmail,
    });

    if (!gymApproval) {
      return res.status(404).json({
        success: false,
        message: "No gym approval record found",
      });
    }

    const gymCode = gymApproval.gymCode;
    const role = gymApproval.role;

    const subscriptions = await MemberSubscriptionPayment.find({
      email: userEmail,
    })
      .sort({ paidDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      clerkUser,
      gymCode,
      role,
      subscriptions,
    });
  } catch (err) {
    console.error("❌ Error fetching subscriptions:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching subscriptions",
      error: err.message,
    });
  }
});

router.get("/total/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;
    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "Gym code is required",
      });
    }

    const result = await MemberSubscriptionPayment.aggregate([
      { $match: { gymCode, status: "Paid" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const totalAmount = result.length > 0 ? result[0].totalAmount : 0;

    res.status(200).json({
      success: true,
      gymCode,
      totalAmount,
      message: `Total amount for gym ${gymCode} fetched successfully`,
    });
  } catch (err) {
    console.error("❌ Error fetching total amount:", err);
    res.status(500).json({
      success: false,
      message: "Server error while calculating total amount",
      error: err.message,
    });
  }
});

/**
 * ==============================================================
 * 🟢 GET /api/member-subscriptions/details/:gymCode
 * Fetch all payment details (paid subscriptions) for a given gym
 * ==============================================================
 */
router.get("/details/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;
    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "Gym code is required",
      });
    }

    const normalizedCode = gymCode.trim().toUpperCase();
    console.log("🟢 Fetching payments for gym:", normalizedCode);

    // ✅ Fetch all paid subscriptions for this gym
    const payments = await MemberSubscriptionPayment.find({
      gymCode: normalizedCode,
      status: "Paid",
    })
      .populate({
        path: "memberId",
        model: "ClerkUser", // make sure it points to ClerkUser
        select: "fullName first_name last_name email",
      })
      .sort({ paidDate: -1 })
      .lean();

    if (!payments.length) {
      console.log(`⚠️ No payments found for gym ${normalizedCode}`);
      return res.status(200).json({
        success: true,
        message: `No payments found for gym ${normalizedCode}`,
        payments: [],
      });
    }

    // ✅ Calculate total revenue
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // ✅ Format data for frontend
    const formatted = payments.map((p) => {
      let memberFullName = "Unknown Member";

      // Try fullName from ClerkUser
      if (p.memberId?.fullName && p.memberId.fullName.trim() !== "") {
        memberFullName = p.memberId.fullName.trim();
      }
      // Else, fallback to first_name + last_name
      else if (p.memberId?.first_name || p.memberId?.last_name) {
        memberFullName = `${p.memberId.first_name || ""} ${
          p.memberId.last_name || ""
        }`.trim();
      }
      // Else, fallback to email
      else if (p.email) {
        memberFullName = p.email;
      }

      return {
        transactionId: p.transactionId,
        memberName: memberFullName,
        email: p.email,
        planName: p.planName,
        duration: p.duration,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paidDate: p.paidDate,
        expiryDate: p.expiryDate,
        description: p.description || "-",
        status: p.status,
      };
    });

    console.log(
      `✅ Returning ${formatted.length} payments for gym ${normalizedCode}`
    );

    res.status(200).json({
      success: true,
      gymCode: normalizedCode,
      totalAmount,
      totalPayments: formatted.length,
      payments: formatted,
    });
  } catch (err) {
    console.error("❌ Error fetching payment details:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment details",
      error: err.message,
    });
  }
});

module.exports = router;
