const express = require("express");
const router = express.Router();
const GymApproval = require("../models/GymApproval");
const verifyClerkToken = require("../middleware/verifyClerkToken");
const cloudinary = require("../config/cloudinary");

// -----------------------------------------------------------------------------
// 🔹 POST /request - Create or update approval request (Admin / Staff)
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 🔹 POST /request - Create or update approval request (Admin / Staff)
// -----------------------------------------------------------------------------
router.post("/request", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode, fullName, requesterEmail, adminEmail, role, clerkRole } =
      req.body;

    if (!gymCode || !requesterEmail || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Normalize values
    const normalizedCode = gymCode.trim().toUpperCase();
    const normalizedEmail = requesterEmail.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    // 🔍 Check for existing approval (avoid duplicates)
    const existing = await GymApproval.findOne({
      gymCode: normalizedCode,
      requesterEmail: normalizedEmail,
      role: normalizedRole,
    });

    if (existing) {
      console.log(
        "⚠️ Approval already exists for:",
        normalizedEmail,
        normalizedRole
      );
      return res.json({ success: true, message: "Approval already requested" });
    }

    // ✅ Try to fetch user's profile image from Clerk
    let profileImageUrl = req.clerkUser?.imageUrl;

    if (profileImageUrl) {
      try {
        const uploadResult = await cloudinary.uploader.upload(profileImageUrl, {
          folder: "gym-approvals",
        });
        profileImageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("⚠️ Cloudinary upload failed:", uploadErr.message);
      }
    }

    // ✅ Create new approval document with profile image
    const approval = await GymApproval.create({
      gymCode: normalizedCode,
      fullName:
        fullName?.trim() ||
        req.clerkUser?.firstName + " " + req.clerkUser?.lastName ||
        "Unknown User",
      requesterEmail: normalizedEmail,
      adminEmail: adminEmail || normalizedEmail,
      role: normalizedRole,
      clerkRole: clerkRole || normalizedRole,
      status: "pending",
      requestedAt: new Date(),
      profileImage: profileImageUrl || null, // ✅ Store image in DB
    });

    console.log("✅ Created new GymApproval:", approval);
    res.json({ success: true, approval });
  } catch (err) {
    console.error("❌ Error in /gym/request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 🔹 GET /requests?type=staff&gymCode=XYZ - Fetch requests by type
// -----------------------------------------------------------------------------
router.get("/requests", verifyClerkToken, async (req, res) => {
  try {
    let { type, gymCode } = req.query;
    type = (type || "").toLowerCase().trim();
    gymCode = (gymCode || "").trim().toUpperCase();

    if (!["admin", "superadmin", "staff", "member"].includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid type. Must be "admin", "staff", "superadmin", or "member".',
      });
    }

    let query = { status: { $in: ["pending", "approved", "rejected"] } };

    if (type === "superadmin")
      query.$or = [{ role: "admin" }, { role: "staff" }];
    else query.$or = [{ role: type }, { clerkRole: type }];

    if (gymCode) query.gymCode = gymCode;

    const requests = await GymApproval.find(query).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ Error fetching requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 🔹 ADMIN join requests for a specific gym (deduplicated)
// -----------------------------------------------------------------------------
router.get("/requests/admin/all", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.query;
    if (!gymCode) {
      return res
        .status(400)
        .json({ success: false, message: "Missing gymCode" });
    }

    console.log("📩 Fetching ADMIN join requests for gym:", gymCode);
    const requests = await GymApproval.find({
      gymCode,
      clerkRole: "admin",
    }).lean();

    if (!requests || requests.length === 0) {
      console.warn("⚠️ No admin requests found for this gym:", gymCode);
      return res.status(200).json([]);
    }

    // ✅ Deduplicate by requesterEmail
    const uniqueMap = new Map();
    for (const r of requests) {
      const key = `${r.gymCode}-${r.requesterEmail}-${r.clerkRole}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, r);
    }

    const uniqueRequests = Array.from(uniqueMap.values());
    console.log(
      `✅ Found ${uniqueRequests.length} unique admin requests for ${gymCode}`
    );
    res.status(200).json(uniqueRequests);
  } catch (err) {
    console.error("❌ Error fetching admin requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 🔹 Approval Status Endpoints
// -----------------------------------------------------------------------------
router.get("/approval-status/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const gymCode = req.params.gymCode?.toUpperCase();
    const userEmail =
      req.clerkUser?.email ||
      req.clerkUser?.primaryEmailAddress?.emailAddress ||
      req.clerkUser?.emailAddresses?.[0]?.emailAddress;

    console.log(
      "📩 Fetching admin approval status for:",
      userEmail,
      "in gym:",
      gymCode
    );

    const request = await GymApproval.findOne({
      gymCode,
      requesterEmail: userEmail,
      clerkRole: "admin",
    });

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "No admin join request found" });

    res.json({ success: true, approvalStatus: request.status || "pending" });
  } catch (err) {
    console.error("❌ Error fetching admin approval status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get(
  "/staff-approval-status/:gymCode",
  verifyClerkToken,
  async (req, res) => {
    try {
      const gymCode = req.params.gymCode?.toUpperCase();
      const staffEmail = req.clerkUser?.email;
      console.log(
        "📩 Staff approval status API called for",
        staffEmail,
        "in",
        gymCode
      );

      const flatDoc = await GymApproval.findOne({
        gymCode,
        requesterEmail: staffEmail,
        clerkRole: "staff",
      });

      if (!flatDoc)
        return res
          .status(404)
          .json({ success: false, message: "No staff approval request found" });

      console.log("✅ Found staff approval status:", flatDoc.status);
      res.json({ success: true, approvalStatus: flatDoc.status || "pending" });
    } catch (err) {
      console.error("❌ Error fetching staff approval status:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get(
  "/member-approval-status/:gymCode",
  verifyClerkToken,
  async (req, res) => {
    try {
      const gymCode = req.params.gymCode?.toUpperCase();
      const memberEmail = req.clerkUser?.email;

      console.log(
        "📩 Member approval status API called for",
        memberEmail,
        "in",
        gymCode
      );

      const approvalDoc = await GymApproval.findOne({
        gymCode,
        requesterEmail: memberEmail,
        clerkRole: "member", // 👈 changed from staff → member
      });

      if (!approvalDoc) {
        return res.status(404).json({
          success: false,
          message: "No member approval request found",
        });
      }

      console.log("✅ Found member approval status:", approvalDoc.status);

      res.json({
        success: true,
        approvalStatus: approvalDoc.status || "pending",
      });
    } catch (err) {
      console.error("❌ Error fetching member approval status:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// -----------------------------------------------------------------------------
// 🔹 Approve or Reject Join Requests
// -----------------------------------------------------------------------------
router.post("/approve/:id", verifyClerkToken, async (req, res) => {
  try {
    const approval = await GymApproval.findById(req.params.id);
    if (!approval)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    approval.status = "approved";
    approval.approvedBy =
      req.clerkUser?.email ||
      req.clerkUser?.primaryEmailAddress?.emailAddress ||
      "System";
    await approval.save();

    console.log(
      `✅ Request approved for ${approval.requesterEmail} (${approval.role})`
    );
    res.json({ success: true, message: "Request approved", approval });
  } catch (err) {
    console.error("❌ Error approving request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/reject/:id", verifyClerkToken, async (req, res) => {
  try {
    const approval = await GymApproval.findById(req.params.id);
    if (!approval)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    approval.status = "rejected";
    approval.rejectedBy =
      req.clerkUser?.email ||
      req.clerkUser?.primaryEmailAddress?.emailAddress ||
      "System";
    await approval.save();

    console.log(
      `❌ Request rejected for ${approval.requesterEmail} (${approval.role})`
    );
    res.json({ success: true, message: "Request rejected", approval });
  } catch (err) {
    console.error("❌ Error rejecting request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 🔹 GET /member-requests/:gymCode - Fetch all pending member requests for a gym
// -----------------------------------------------------------------------------
router.get("/member-requests/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;

    if (!gymCode) {
      return res
        .status(400)
        .json({ success: false, message: "Missing gymCode parameter" });
    }

    console.log(`📩 Fetching member requests for gym: ${gymCode}`);

    const requests = await GymApproval.find({
      gymCode: gymCode.toUpperCase(),
      clerkRole: "member",
      status: { $in: ["pending", "approved", "rejected"] },
    }).sort({ requestedAt: -1 });

    if (!requests.length) {
      console.warn(`⚠️ No member requests found for gym: ${gymCode}`);
      return res.json({ success: true, requests: [] });
    }

    console.log(`✅ Found ${requests.length} member requests`);
    res.json({ success: true, requests });
  } catch (err) {
    console.error("❌ Error fetching member requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 🔹 Utility: Fix legacy roles if needed
// -----------------------------------------------------------------------------
router.post("/fix-old-roles", async (req, res) => {
  try {
    const result = await GymApproval.updateMany(
      { role: "superadmin", clerkRole: "admin" },
      { $set: { role: "admin" } }
    );
    res.json({ success: true, message: "Old roles fixed", result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 🔹 GET /my-gym - Fetch the logged-in user's gym details
// -----------------------------------------------------------------------------
router.get("/my-gym", verifyClerkToken, async (req, res) => {
  try {
    let userEmail =
      req.clerkUser?.email ||
      req.clerkUser?.primaryEmailAddress?.emailAddress ||
      req.clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid Clerk token — email missing",
      });
    }

    // ✅ Normalize email (trim + lowercase)
    userEmail = userEmail.trim().toLowerCase();

    console.log("📩 Fetching gym details for:", userEmail);

    // ✅ Find the user's gym record (case-insensitive search)
    const gymApproval = await GymApproval.findOne({
      requesterEmail: { $regex: new RegExp(`^${userEmail}$`, "i") },
    });

    if (!gymApproval) {
      console.warn("⚠️ No gym approval record found for user:", userEmail);

      // Optional: auto-create a default "no gym" placeholder to prevent 404 errors
      return res.status(200).json({
        success: false,
        gym: null,
        message: "No gym found. Please join a gym first.",
      });
    }

    // ✅ Success response
    res.status(200).json({
      success: true,
      gym: {
        gymCode: gymApproval.gymCode,
        gymName: gymApproval.gymName || "Unnamed Gym",
        role: gymApproval.role,
        status: gymApproval.status,
        requesterEmail: gymApproval.requesterEmail,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching my-gym info:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching gym info",
      error: err.message,
    });
  }
});

// -----------------------------------------------------------------------------
// 🔹 GET /stats/:gymCode - Fetch total members & total staff for a gym
// -----------------------------------------------------------------------------
router.get("/stats/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;
    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "Gym code is required",
      });
    }

    console.log("📊 Fetching member & staff stats for gym:", gymCode);

    // ✅ Count members & staff linked to this gym code
    const totalMembers = await GymApproval.countDocuments({
      gymCode: gymCode.toUpperCase(),
      clerkRole: "member",
      status: "approved",
    });

    const totalStaff = await GymApproval.countDocuments({
      gymCode: gymCode.toUpperCase(),
      clerkRole: "staff",
      status: "approved",
    });

    res.status(200).json({
      success: true,
      gymCode: gymCode.toUpperCase(),
      totalMembers,
      totalStaff,
      message: "Gym stats fetched successfully",
    });
  } catch (err) {
    console.error("❌ Error fetching gym stats:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching gym stats",
      error: err.message,
    });
  }
});

module.exports = router;
