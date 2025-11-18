const express = require("express");
const router = express.Router();
const StaffApproval = require("../models/StaffApproval");
const verifyClerkToken = require("../middleware/verifyClerkToken");

// --------------------------
// POST /api/staff-approvals/request
// Staff sends request to join a gym
// --------------------------
router.post("/request", verifyClerkToken, async (req, res) => {
  try {
    if (!req.clerkUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Clerk user",
      });
    }

    const { gymCode, staffFullName, staffEmail, adminEmail } = req.body;

    console.log("📥 Received staff approval request:", req.body);
    if (!gymCode || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing gymCode or adminEmail",
      });
    }

    const role = "staff";

    const approvalData = {
      staffFullName:
        staffFullName ||
        `${req.clerkUser.first_name} ${req.clerkUser.last_name}`.trim() ||
        "Unknown Staff",
      staffEmail:
        staffEmail || req.clerkUser?.email_addresses?.[0]?.email_address,
      role,
      clerkRole: role,
      gymCode: gymCode.toUpperCase(),
      adminEmail,
      status: "pending",
      requestedAt: new Date(),
    };

    // ✅ Upsert: avoid duplicate requests for same staff + gym
    const approval = await StaffApproval.findOneAndUpdate(
      { gymCode: gymCode.toUpperCase(), staffEmail: approvalData.staffEmail },
      { $set: approvalData },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Staff join request sent successfully",
      approval,
    });
  } catch (err) {
    console.error("❌ Error in /staff-approvals/request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------------
// GET /api/staff-approvals/requests?gymCode=XYZ123
// Admin fetches all staff requests for their gym
// --------------------------
router.get("/requests", verifyClerkToken, async (req, res) => {
  try {
    let { gymCode } = req.query;
    gymCode = (gymCode || "").trim().toUpperCase();

    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "Missing gymCode in request query",
      });
    }

    console.log("🔍 Looking for requests with gymCode:", gymCode);

    const requests = await StaffApproval.find({
      gymCode: { $regex: `^${gymCode}$`, $options: "i" }, // ✅ case-insensitive search
    })
      .sort({ status: 1, requestedAt: -1 })
      .lean();

    if (!requests || requests.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No staff join requests found for gym ${gymCode}`,
        requests: [],
      });
    }

    console.log(`✅ Found ${requests.length} staff join requests`);
    res.json({
      success: true,
      message: `Fetched ${requests.length} staff requests for ${gymCode}`,
      requests,
    });
  } catch (err) {
    console.error("❌ Error fetching staff requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------------
// POST /api/staff-approvals/approve/:id
// Approve staff request
// --------------------------
router.post("/approve/:id", verifyClerkToken, async (req, res) => {
  try {
    const request = await StaffApproval.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    request.status = "approved";
    request.approvedAt = new Date();
    request.approvedBy = req.clerkUser?.first_name || "Admin";
    await request.save();

    res.json({ success: true, message: "Staff request approved", request });
  } catch (err) {
    console.error("❌ Error approving staff request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------------
// POST /api/staff-approvals/reject/:id
// Reject staff request
// --------------------------
router.post("/reject/:id", verifyClerkToken, async (req, res) => {
  try {
    const request = await StaffApproval.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    request.status = "rejected";
    request.rejectedAt = new Date();
    request.rejectedBy = req.clerkUser?.first_name || "Admin";
    await request.save();

    res.json({ success: true, message: "Staff request rejected" });
  } catch (err) {
    console.error("❌ Error rejecting staff request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------------
// GET /api/staff-approvals/approval-status/:gymCode
// Get approval status for specific staff & gym
// --------------------------
router.get("/approval-status/:gymCode", verifyClerkToken, async (req, res) => {
  const { gymCode } = req.params;
  const staffEmail =
    req.clerkUser?.email_addresses?.[0]?.email_address?.toLowerCase();

  try {
    const approvalRecord = await StaffApproval.findOne({
      gymCode: gymCode.toUpperCase(),
      staffEmail,
    });

    if (!approvalRecord) {
      return res.status(404).json({
        success: false,
        message: "Staff join request not found",
      });
    }

    res.json({
      success: true,
      approvalStatus: approvalRecord.status,
    });
  } catch (err) {
    console.error("❌ Error fetching staff approval status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
