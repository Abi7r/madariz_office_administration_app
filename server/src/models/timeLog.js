const mongoose = require("mongoose");

// const timeLogSchema = new mongoose.Schema(
//   {
//     subtask: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Subtask",
//       required: true,
//     },
//     employee: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     startTime: {
//       type: Date,
//       required: true,
//     },
//     endTime: {
//       type: Date,
//     },
//     duration: {
//       type: Number, // in minutes
//       default: 0,
//     },
//     remark: {
//       type: String,
//     },
//     date: {
//       type: Date,
//       required: true,
//       default: Date.now,
//     },
//     billedAmount: {
//       type: Number,
//     },
//     status: {
//       type: String,
//       enum: ["PENDING", "APPROVED", "REJECTED"],
//       default: "PENDING",
//     },
//     approvedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     approvedAt: {
//       type: Date,
//     },
//     editedHours: {
//       type: Number,
//     },
//     rejectionReason: {
//       type: String,
//     },
//   },
//   { timestamps: true },
// );
const timeLogSchema = new mongoose.Schema(
  {
    subtask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtask",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    remark: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    editedHours: {
      type: Number,
    },
    rejectionReason: {
      type: String,
    },
    billedAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);
// Index for faster queries
timeLogSchema.index({ employee: 1, date: 1 });
timeLogSchema.index({ subtask: 1 });
timeLogSchema.index({ status: 1 });

module.exports = mongoose.model("TimeLog", timeLogSchema);
