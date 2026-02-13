const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    estimatedHours: {
      type: Number,
      required: true,
    },
    loggedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "OUTSTANDING"],
      default: "PENDING",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subtask", subtaskSchema);
