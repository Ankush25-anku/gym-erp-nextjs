// models/WorkoutAssignment.js
const mongoose = require("mongoose");

const WorkoutItemSchema = new mongoose.Schema({
  day: String,
  workout: String,
  sets: String,
  reps: String,
  weight: String,
  rest: String,
  description: String,
  images: [String],
});

const WorkoutAssignmentSchema = new mongoose.Schema({
  assignedBy: String,
  assignTo: { type: String, default: "member" },

  // NEW FIELDS YOU MUST ADD
  memberEmail: { type: String, required: true },
  gymCode: { type: String, required: true },

  fromDate: Date,
  repeatDays: [String],

  workouts: [WorkoutItemSchema], // array of workouts
});

module.exports = mongoose.model("WorkoutAssignment", WorkoutAssignmentSchema);
