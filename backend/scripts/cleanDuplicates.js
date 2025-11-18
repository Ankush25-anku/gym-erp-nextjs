const mongoose = require("mongoose");
const GymApproval = require("../models/GymApproval");

require("dotenv").config();

async function cleanDuplicates() {
  await mongoose.connect(process.env.MONGO_URI);

  const approvals = await GymApproval.find();
  const seen = new Set();
  const duplicates = [];

  for (const doc of approvals) {
    const key = `${doc.gymCode}-${doc.adminEmail}-${doc.requesterEmail}`;
    if (seen.has(key)) {
      duplicates.push(doc._id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    await GymApproval.deleteMany({ _id: { $in: duplicates } });
    console.log(`🧹 Removed ${duplicates.length} duplicate approvals.`);
  } else {
    console.log("✅ No duplicates found.");
  }

  await mongoose.disconnect();
}

cleanDuplicates().catch(console.error);
