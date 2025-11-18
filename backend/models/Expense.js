// const mongoose = require("mongoose");

// const ExpenseSchema = new mongoose.Schema(
//   {
//     gymId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Gym",
//       required: true,
//     },
//     category: {
//       type: String,
//       required: true,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     paidTo: {
//       type: String,
//     },
//     date: {
//       type: Date,
//       required: true,
//     },
//     paymentMethod: {
//       type: String,
//     },
//     description: {
//       type: String,
//     },
//     receiptUrl: {
//       type: String,
//     },
//     // ✅ Associate with Clerk user
//     userId: {
//       type: String,
//       required: true, // Clerk user ID (sub)
//     },
//     userEmail: {
//       type: String,
//       required: true, // Clerk email
//     },
//   },
//   {
//     timestamps: true, // createdAt and updatedAt
//   }
// );

// module.exports = mongoose.model("Expense", ExpenseSchema);

const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    gymCode: {
      type: String,
      required: true,
    },
    expenseCategory: {
      type: String,
      required: true,
    },
    expenseDetail: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "Card", "Online", "UPI", "Cheque"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    transactionId: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String, // Clerk or Admin email
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
