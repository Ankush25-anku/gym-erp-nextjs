const admin = require("firebase-admin");

let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
  console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT in .env");
  process.exit(1);
}

// Parse JSON
serviceAccount = JSON.parse(serviceAccount);

// Convert escaped \n to real newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
