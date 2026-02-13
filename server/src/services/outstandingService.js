const Subtask = require("../models/subtask");
const TimeLog = require("../models/timeLog");

exports.checkOutstandingSubtasks = async () => {
  const now = new Date();
  const thresholdHours = 24; // configurable
  const thresholdMs = thresholdHours * 60 * 60 * 1000;

  const subtasks = await Subtask.find({
    status: { $in: ["PENDING", "IN_PROGRESS"] },
  });

  for (const subtask of subtasks) {
    const lastLog = await TimeLog.findOne({
      subtask: subtask._id,
      endTime: { $ne: null },
    }).sort({ endTime: -1 });

    const referenceTime = lastLog ? lastLog.endTime : subtask.createdAt;

    if (now - referenceTime > thresholdMs) {
      subtask.status = "OUTSTANDING";
      await subtask.save();
    }
  }
};
