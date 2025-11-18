const express = require("express");
const router = express.Router();
const ClerkUser = require("../models/ClerkUser");
const verifyClerkToken = require("../middleware/verifyClerkToken");

// 🔁 Sync Clerk user to MongoDB with full profile
router.post("/sync", verifyClerkToken, async (req, res) => {
  try {
    const { sub, email: clerkEmail, first_name, last_name } = req.clerkUser;
    const {
      schoolCode,
      fullName,
      email,
      phone,
      gender,

      dob,
      address,
      city,
      state,
      country,
      zipcode,
      imageUrl,
      additionalInfo,
      role,
    } = req.body;

    const finalFullName =
      fullName?.trim() ||
      `${first_name || ""} ${last_name || ""}`.trim() ||
      (email ? email.split("@")[0] : "");

    const finalEmail = email || clerkEmail;

    const updatedUser = await ClerkUser.findOneAndUpdate(
      { sub },
      {
        sub,
        email: finalEmail,
        first_name,
        last_name,
        fullName: finalFullName,
        role,
        phone: phone || "",
        gender: gender || "",
        dob: dob || "",
        schoolCode: schoolCode || "",
        requestAdminAccess: req.body.requestAdminAccess || false,
        address: address || "",
        city: city || "",
        state: state || "",
        country: country || "",
        zipcode: zipcode || "",
        imageUrl: imageUrl || "",
        additionalInfo: additionalInfo || "",
      },
      { upsert: true, new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("🔴 Sync Error:", err);
    res.status(500).json({ error: "Failed to sync Clerk user" });
  }
});

// 🙋‍♂️ Get logged-in Clerk user info
router.get("/me", verifyClerkToken, async (req, res) => {
  try {
    const { sub, role, email, fullName } = req.clerkUser;

    // Try by sub first
    let user = await ClerkUser.findOne({ sub });

    // If not found, try by email
    if (!user && email) {
      user = await ClerkUser.findOne({ email });
    }

    // 🧩 Auto-fix missing fullName in DB
    if (user && !user.fullName) {
      user.fullName =
        `${req.clerkUser.first_name || ""} ${
          req.clerkUser.last_name || ""
        }`.trim() || "";
      await user.save();
      console.log("🧩 Auto-fixed missing fullName for:", user.email);
    }

    // If still not found, fallback
    if (!user) {
      return res.json({
        sub,
        email,
        role: role || "user",
        fullName: fullName || "User",
      });
    }

    res.json({
      sub: user.sub,
      email: user.email,
      role: user.role || role || "user",
      fullName: user.fullName || fullName || "User",
      phone: user.phone || "",
      gender: user.gender || "",
      dob: user.dob || "",
      gymCode: user.gymCode || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      zipcode: user.zipcode || "",
      imageUrl: user.imageUrl || "",
      additionalInfo: user.additionalInfo || "",
    });
  } catch (err) {
    console.error("🔴 /me route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// routes/clerkUsers.js
router.get("/get-role", verifyClerkToken, async (req, res) => {
  try {
    const { sub, email, first_name, last_name, role } = req.clerkUser;

    // Try to find existing Clerk user
    let user = await ClerkUser.findOne({ sub });

    if (!user) {
      user = await ClerkUser.create({
        sub,
        email,
        first_name,
        last_name,
        fullName: `${first_name} ${last_name}`.trim() || "",
        role: role || "member",
      });
      console.log("🟢 New ClerkUser created:", user);
    }

    // 🔍 Check if the Clerk user is also an Employee (staff)
    const Employee = require("../models/Employee");
    const employee = await Employee.findOne({ email });

    let finalRole = user.role;
    if (employee && employee.requestAdminAccess) {
      finalRole = "admin";
    } else if (employee) {
      finalRole = "staff";
    }

    res.json({
      role: finalRole,
      allowedEmail: user.email,
      requestAdminAccess: employee?.requestAdminAccess || false,
    });
  } catch (err) {
    console.error("🔴 /get-role route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
