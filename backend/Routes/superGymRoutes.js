const express = require("express");
const router = express.Router();
const verifyClerkToken = require("../middleware/verifyClerkToken");

// Import Gym model
const Gym = require("../models/SuperGym");
const GymApproval = require("../models/GymApproval");

/**
 * @route   POST /api/supergyms/add
 * @desc    Add new gym
 */
router.post("/add", verifyClerkToken, async (req, res) => {
  try {
    let {
      name,
      email,
      phone,
      address,
      pincode,
      subscriptionPlan,
      status,
      gymCode,
      profileImage,
    } = req.body;

    // ✅ Normalize before saving
    gymCode = (gymCode || "").trim().toUpperCase();

    const newGym = new Gym({
      name,
      email,
      phone,
      address,
      pincode,
      subscriptionPlan,
      status,
      gymCode,
      profileImage,
      createdBy: req.clerkUser.email,
    });

    await newGym.save();

    res.status(201).json({ success: true, gym: newGym });
  } catch (err) {
    console.error("❌ Failed to add gym:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/supergyms
 * @desc    Get all gyms
 */
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    const gyms = await Gym.find();
    res.json({ success: true, gyms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/supergyms/verify-code
 * @desc    Verify gym code
 */
/**
 * @route   POST /api/supergyms/verify-code
 * @desc    Verify gym code
 */
router.post("/verify-code", verifyClerkToken, async (req, res) => {
  try {
    let { gymCode } = req.body;
    gymCode = (gymCode || "").trim().toUpperCase(); // ✅ Normalize

    console.log("🔍 Checking code in DB:", gymCode); // 👈 Debug log here

    if (!gymCode) {
      return res
        .status(400)
        .json({ valid: false, message: "Gym code required" });
    }

    const gym = await Gym.findOne({ gymCode });
    if (gym) {
      return res.json({ valid: true, message: "✅ Gym code is valid" });
    } else {
      return res.json({ valid: false, message: "❌ Invalid gym code" });
    }
  } catch (err) {
    console.error("❌ Error verifying gym code:", err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

/**
 * @route   POST /api/supergyms/join
 * @desc    Join gym with code
 */
/**
 * @route   POST /api/supergyms/join
 * @desc    Join gym with code
 */
/**
 * @route   POST /api/supergyms/join
 * @desc    Join gym with code
 */

// -----------------------------------------------------------------------------
// 🔹 JOIN GYM (Handles SuperAdmin, Admin, Staff)
// -----------------------------------------------------------------------------
router.post("/join", verifyClerkToken, async (req, res) => {
  try {
    console.log("🏋️ /join called");
    console.log("📨 Body:", req.body);
    console.log("🧑 Clerk user:", req.clerkUser);

    const gymCode = (req.body.gymCode || "").trim().toUpperCase();
    const profileImage = req.body.profileImage || null;

    const userEmail =
      req.clerkUser?.email ||
      req.clerkUser?.primaryEmailAddress?.emailAddress ||
      req.clerkUser?.emailAddresses?.[0]?.emailAddress;
    const fullName =
      req.clerkUser?.fullName || req.clerkUser?.firstName || "Unknown User";
    const clerkRole = (req.clerkUser?.role || "staff").toLowerCase().trim();

    if (!gymCode || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Gym code and email are required",
      });
    }

    // 🔍 Check if gym exists
    const gym = await Gym.findOne({ gymCode });
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Invalid gym code",
      });
    }

    // 👥 Add user to gym members if not already added
    if (!Array.isArray(gym.members)) gym.members = [];
    if (!gym.members.includes(userEmail)) {
      gym.members.push(userEmail);
    }

    // ✅ Update gym profile image if joining user is SuperAdmin
    if (clerkRole === "superadmin" && profileImage) {
      gym.profileImage = profileImage;
      console.log("🖼️ Stored superadmin profile image in Gym:", profileImage);
    }

    await gym.save();

    // ✅ Create GymApproval record if SuperAdmin joins
    if (clerkRole === "superadmin") {
      console.log("🟣 SuperAdmin joining gym, creating approval record");

      const existing = await GymApproval.findOne({
        gymCode,
        requesterEmail: userEmail,
        clerkRole: "superadmin",
      });

      if (!existing) {
        const approval = await GymApproval.create({
          gymCode,
          fullName,
          requesterEmail: userEmail,
          adminEmail: userEmail,
          role: "superadmin",
          clerkRole: "superadmin",
          status: "approved", // auto-approved
          requestedAt: new Date(),
          profileImage, // 🧩 save image here too
        });

        console.log("✅ Created SuperAdmin GymApproval with image:", approval);
      }
    }

    console.log("🏁 Join completed successfully:", { gymCode, clerkRole });

    res.status(200).json({
      success: true,
      message: `Joined gym successfully (${clerkRole}).`,
      profileImage,
    });
  } catch (err) {
    console.error("❌ Error in /join route:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/my-gym", verifyClerkToken, async (req, res) => {
  try {
    const userEmail = req.clerkUser.email;
    const gym = await Gym.findOne({ members: userEmail });

    if (!gym) {
      return res.json({ gymCode: null, message: "No gym joined yet" });
    }

    res.json({ gymCode: gym.gymCode, gymName: gym.name });
  } catch (err) {
    console.error("❌ Error fetching admin gym:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/supergyms/code/:gymCode
 * @desc    Fetch full gym details by gymCode (used for displaying logo/profile image)
 */
router.get("/code/:gymCode", verifyClerkToken, async (req, res) => {
  try {
    const { gymCode } = req.params;

    if (!gymCode) {
      return res.status(400).json({
        success: false,
        message: "Gym code is required",
      });
    }

    const gym = await Gym.findOne({ gymCode: gymCode.toUpperCase() });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    res.json({
      success: true,
      gym,
    });
  } catch (err) {
    console.error("❌ Error fetching gym by code:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


router.get("/joined", verifyClerkToken, async (req, res) => {
  try {
    const userEmail = req.clerkUser.email;
    const gym = await Gym.findOne({ members: userEmail });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "No gym joined yet",
      });
    }

    res.json({
      success: true,
      joinedGym: {
        gymCode: gym.gymCode,
        gymName: gym.name,
        profileImage: gym.profileImage || null,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching joined gym:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


module.exports = router;
