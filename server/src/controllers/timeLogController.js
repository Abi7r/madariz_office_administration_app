const TimeLog = require("../models/timeLog");
const Subtask = require("../models/subtask");
const Query = require("../models/query");
const LedgerEntry = require("../models/ledgerEntry");
const { validationResult } = require("express-validator");

// Start Work Timer
exports.startWork = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subtaskId } = req.body;

    // Verify subtask exists and is assigned to user
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    if (subtask.assignedTo.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Cannot log time on unassigned subtask" });
    }

    if (subtask.status === "OUTSTANDING") {
      return res.status(400).json({
        message: "Subtask is marked as OUTSTANDING. HR intervention required.",
      });
    }

    // Check if there's an open query
    const openQuery = await Query.findOne({
      subtask: subtaskId,
      status: { $ne: "CLOSED" },
    });

    if (openQuery) {
      return res.status(400).json({
        message: "Cannot start timer. Subtask has an open query.",
        query: openQuery,
      });
    }

    // Check if user already has a running timer
    const runningTimer = await TimeLog.findOne({
      employee: req.user.id,
      endTime: null,
    });

    if (runningTimer) {
      return res.status(400).json({
        message: "You already have a running timer. Please stop it first.",
        runningTimer,
      });
    }

    // Create new time log
    const timeLog = await TimeLog.create({
      subtask: subtaskId,
      employee: req.user.id,
      startTime: new Date(),
      date: new Date(),
    });

    // Update subtask status to IN_PROGRESS
    await Subtask.findByIdAndUpdate(subtaskId, { status: "IN_PROGRESS" });

    await timeLog.populate("subtask employee");

    res.status(201).json({
      message: "Timer started successfully",
      timeLog,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Stop Work Timer
exports.stopWork = async (req, res) => {
  try {
    const { timeLogId, remark } = req.body;

    const timeLog = await TimeLog.findById(timeLogId);

    if (!timeLog) {
      return res.status(404).json({ message: "Time log not found" });
    }

    if (timeLog.employee.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (timeLog.endTime) {
      return res.status(400).json({ message: "Timer already stopped" });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - timeLog.startTime) / (1000 * 60)); // minutes

    timeLog.endTime = endTime;
    timeLog.duration = duration;
    if (remark) timeLog.remark = remark;
    await timeLog.save();

    // Update subtask logged hours
    const subtask = await Subtask.findById(timeLog.subtask);
    const allLogs = await TimeLog.find({
      subtask: timeLog.subtask,
      endTime: { $ne: null },
    });
    const totalMinutes = allLogs.reduce((sum, log) => sum + log.duration, 0);
    subtask.loggedHours = (totalMinutes / 60).toFixed(2);
    await subtask.save();

    await timeLog.populate("subtask employee");

    res.json({
      message: "Timer stopped successfully",
      timeLog,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Active Timer
exports.getActiveTimer = async (req, res) => {
  try {
    const timer = await TimeLog.findOne({
      employee: req.user.id,
      endTime: null,
    }).populate("subtask");

    res.json(timer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Today's Logs (Employee)
exports.getTodayLogs = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await TimeLog.find({
      employee: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    }).populate({
      path: "subtask",
      populate: { path: "task" },
    });

    const totalMinutes = logs.reduce(
      (sum, log) => sum + (log.duration || 0),
      0,
    );

    res.json({
      logs,
      totalHours: (totalMinutes / 60).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Time Logs (with filters)
exports.getTimeLogs = async (req, res) => {
  try {
    const { employee, subtask, status, date } = req.query;
    const filter = {};

    if (employee) filter.employee = employee;
    if (subtask) filter.subtask = subtask;
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const logs = await TimeLog.find(filter)
      .populate("employee subtask approvedBy")
      .sort({ date: -1, startTime: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Day-End Review - Get Pending Logs (HR)
exports.getPendingLogs = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { status: "PENDING", endTime: { $ne: null } };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const logs = await TimeLog.find(filter)
      .populate({
        path: "employee",
        select: "name email",
      })
      .populate({
        path: "subtask",
        populate: { path: "task" },
      })
      .sort({ date: -1, startTime: -1 });

    // Group by employee
    const grouped = logs.reduce((acc, log) => {
      if (!log.employee) return acc;

      const empId = log.employee._id.toString();
      if (!acc[empId]) {
        acc[empId] = {
          employee: log.employee,
          logs: [],
          totalHours: 0,
        };
      }
      acc[empId].logs.push(log);
      acc[empId].totalHours += (log.duration || 0) / 60;
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.approveTimeLog = async (req, res) => {
//   try {
//     const { editedHours } = req.body;

//     const timeLog = await TimeLog.findById(req.params.id).populate({
//       path: "subtask",
//       populate: {
//         path: "task",
//         populate: { path: "client" },
//       },
//     });

//     if (!timeLog) {
//       return res.status(404).json({ message: "Time log not found" });
//     }

//     timeLog.status = "APPROVED";
//     timeLog.approvedBy = req.user.id;
//     timeLog.approvedAt = new Date();

//     if (editedHours !== undefined) {
//       timeLog.editedHours = editedHours;
//     }
//     timeLog.billedAmount = amount;
//     await timeLog.save();

//     const approvedHours =
//       editedHours !== undefined ? Number(editedHours) : timeLog.duration / 60;

//     const client = timeLog.subtask.task.client;
//     const rate = client.hourlyRate;
//     const amount = approvedHours * rate;

//     timeLog.billedAmount = amount;
//     await timeLog.save();

//     // Get last balance
//     const lastEntry = await LedgerEntry.findOne({ client: client._id }).sort({
//       date: -1,
//     });

//     const previousBalance = lastEntry ? lastEntry.balance : 0;
//     const newBalance = previousBalance + amount;

//     await LedgerEntry.create({
//       client: client._id,
//       date: new Date(),
//       description: `Work on ${timeLog.subtask.title}`,
//       debit: amount,
//       credit: 0,
//       balance: newBalance,
//     });

//     res.json({
//       message: "Time log approved and billed",
//       billedAmount: amount,
//       timeLog,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.approveTimeLog = async (req, res) => {
  try {
    const { editedHours } = req.body;

    const timeLog = await TimeLog.findById(req.params.id).populate({
      path: "subtask",
      populate: {
        path: "task",
        populate: { path: "client" },
      },
    });

    if (!timeLog) {
      return res.status(404).json({ message: "Time log not found" });
    }

    const approvedHours =
      editedHours !== undefined ? Number(editedHours) : timeLog.duration / 60;

    const client = timeLog.subtask.task.client;
    const rate = client.hourlyRate;
    const amount = approvedHours * rate;

    // Update time log
    timeLog.status = "APPROVED";
    timeLog.approvedBy = req.user.id;
    timeLog.approvedAt = new Date();
    timeLog.editedHours = editedHours !== undefined ? editedHours : undefined;
    timeLog.billedAmount = amount;

    await timeLog.save();

    // Get last balance
    const lastEntry = await LedgerEntry.findOne({
      client: client._id,
    }).sort({ date: -1 });

    const previousBalance = lastEntry ? lastEntry.balance : 0;
    const newBalance = previousBalance + amount;

    await LedgerEntry.create({
      client: client._id,
      date: new Date(),
      description: `Work on ${timeLog.subtask.title}`,
      debit: amount,
      credit: 0,
      balance: newBalance,
    });

    res.json({
      message: "Time log approved and billed",
      billedAmount: amount,
      timeLog,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject Time Log (HR)
exports.rejectTimeLog = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) {
      return res.status(404).json({ message: "Time log not found" });
    }

    timeLog.status = "REJECTED";
    timeLog.approvedBy = req.user.id;
    timeLog.approvedAt = new Date();
    timeLog.rejectionReason = rejectionReason;

    await timeLog.save();
    await timeLog.populate("employee subtask approvedBy");

    res.json({
      message: "Time log rejected",
      timeLog,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
