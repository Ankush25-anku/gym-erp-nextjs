// const express = require("express");
// const router = express.Router();
// const AdminTrainer = require("../models/admintrainer");
// const Gym = require("../models/Gym");
// const authMiddleware = require("../middleware/auth"); // 🔒 Auth middleware

// // ✅ GET trainers for logged-in user
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const { gymId } = req.query;
//     let filter = {};

//     if (gymId && gymId !== "all") {
//       filter.gymId = gymId; // 👉 Super admin filtering by gym
//     } else {
//       filter.userEmail = req.user.email; // 👉 Default: filter by logged-in user
//     }

//     const trainers = await AdminTrainer.find(filter).populate("gymId", "name");
//     res.json(trainers);
//   } catch (err) {
//     console.error("❌ Error fetching trainers:", err);
//     res.status(500).json({ error: "Failed to fetch trainers" });
//   }
// });

// // ✅ POST a new trainer for the logged-in user
// router.post("/", authMiddleware, async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       experience,
//       rating,
//       specialties,
//       members,
//       status,
//       joined,
//       gymId,
//     } = req.body;

//     const newTrainer = new AdminTrainer({
//       name,
//       email,
//       experience,
//       rating,
//       specialties,
//       members,
//       status,
//       joined,
//       gymId,
//       userEmail: req.user.email,       // ✅ Associate with logged-in user
//       createdBy: req.user._id || req.user.id, // ✅ (optional) if your model supports it
//     });

//     const saved = await newTrainer.save();
//     const populated = await saved.populate("gymId", "name");
//     res.status(201).json(populated);
//   } catch (err) {
//     console.error("❌ Trainer creation error:", err);
//     res.status(400).json({ error: "Failed to add trainer" });
//   }
// });

// // ✅ PUT update a trainer
// router.put("/:id", authMiddleware, async (req, res) => {
//   try {
//     // Ensure the user can only update their own trainer
//     const trainer = await AdminTrainer.findOne({
//       _id: req.params.id,
//       userEmail: req.user.email,
//     });

//     if (!trainer) {
//       return res.status(403).json({ error: "Unauthorized access" });
//     }

//     const updated = await AdminTrainer.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     ).populate("gymId", "name");

//     res.json(updated);
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ error: "Failed to update trainer" });
//   }
// });

// // ✅ DELETE a trainer
// router.delete("/:id", authMiddleware, async (req, res) => {
//   try {
//     // Ensure the user can only delete their own trainer
//     const trainer = await AdminTrainer.findOne({
//       _id: req.params.id,
//       userEmail: req.user.email,
//     });

//     if (!trainer) {
//       return res.status(403).json({ error: "Unauthorized access" });
//     }

//     await AdminTrainer.findByIdAndDelete(req.params.id);
//     res.json({ message: "Trainer deleted" });
//   } catch (err) {
//     res.status(400).json({ error: "Failed to delete trainer" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const AdminTrainer = require("../models/admintrainer");
const Gym = require("../models/Gym");
const verifyClerkToken = require("../middleware/verifyClerkToken");

// ✅ GET trainers for logged-in user
router.get("/", verifyClerkToken, async (req, res) => {
  try {
    console.log("🔹 GET /api/admintrainers called");
    console.log("🔹 clerkUser:", req.clerkUser);

    const { gymId } = req.query;
    const userId = req.clerkUser?.sub; // ✅ Corrected to .sub
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    let filter = { userId };

    if (gymId && gymId !== "all") {
      filter.gymId = gymId;
    }

    console.log("🔎 Trainer filter:", filter);
    const trainers = await AdminTrainer.find(filter).populate("gymId", "name");
    res.json(trainers);
  } catch (err) {
    console.error("❌ Error fetching trainers:", err);
    res.status(500).json({ error: "Failed to fetch trainers" });
  }
});

// ✅ POST trainer
router.post("/", verifyClerkToken, async (req, res) => {
  try {
    console.log("🔹 POST /api/admintrainers called");
    const userId = req.clerkUser?.sub;
    const userEmail = req.clerkUser?.email;

    if (!userId || !userEmail)
      return res.status(401).json({ error: "Unauthorized" });

    console.log("🔹 Creating trainer for:", { userId, userEmail });

    const newTrainer = new AdminTrainer({
      ...req.body,
      userId,
      userEmail,
    });

    const saved = await newTrainer.save();
    const populated = await saved.populate("gymId", "name");
    console.log("✅ Trainer saved:", populated);
    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Trainer creation error:", err);
    res.status(400).json({ error: "Failed to add trainer" });
  }
});

// ✅ PUT trainer
router.put("/:id", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    console.log("🔹 PUT /api/admintrainers/:id called by user:", userId);

    const trainer = await AdminTrainer.findOne({ _id: req.params.id, userId });
    if (!trainer) return res.status(403).json({ error: "Unauthorized access" });

    const updated = await AdminTrainer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("gymId", "name");

    console.log("✅ Trainer updated:", updated);
    res.json(updated);
  } catch (err) {
    console.error("❌ Trainer update error:", err);
    res.status(400).json({ error: "Failed to update trainer" });
  }
});

// ✅ DELETE trainer
router.delete("/:id", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUser?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    console.log("🔹 DELETE /api/admintrainers/:id called by user:", userId);

    const trainer = await AdminTrainer.findOne({ _id: req.params.id, userId });
    if (!trainer) return res.status(403).json({ error: "Unauthorized access" });

    await AdminTrainer.findByIdAndDelete(req.params.id);
    console.log("✅ Trainer deleted:", req.params.id);
    res.json({ message: "Trainer deleted" });
  } catch (err) {
    console.error("❌ Trainer deletion error:", err);
    res.status(400).json({ error: "Failed to delete trainer" });
  }
});

module.exports = router;
