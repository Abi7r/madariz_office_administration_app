const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    subtask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtask",
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["CLARIFICATION", "BLOCKER", "APPROVAL_NEEDED"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "REPLIED", "CLOSED"],
      default: "OPEN",
    },
    reply: {
      type: String,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    repliedAt: {
      type: Date,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

querySchema.index({ subtask: 1, status: 1 });
querySchema.index({ raisedBy: 1 });

module.exports = mongoose.model("Query", querySchema);
