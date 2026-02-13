const Subtask = require("../models/subtask");
const TimeLog = require("../models/timeLog");
const Query = require("../models/query");
const LedgerEntry = require("../models/ledgerEntry");
const Client = require("../models/client");

// Employee Dashboard
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get assigned subtasks with task and client details
    const subtasks = await Subtask.find({
      assignedTo: userId,
      status: { $ne: "COMPLETED" },
    })
      .populate({
        path: "task",
        populate: { path: "client" },
      })
      .sort({ createdAt: -1 });

    // Get today's time logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await TimeLog.find({
      employee: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    const totalMinutes = todayLogs.reduce(
      (sum, log) => sum + (log.duration || 0),
      0,
    );

    // Get active timer
    const activeTimer = await TimeLog.findOne({
      employee: userId,
      endTime: null,
    }).populate("subtask");

    // Get open queries
    const openQueries = await Query.find({
      raisedBy: userId,
      status: { $ne: "CLOSED" },
    }).populate("subtask");

    // Format subtasks for dashboard
    const formattedSubtasks = subtasks.map((st) => {
      const hasOpenQuery = openQueries.some(
        (q) => q.subtask._id.toString() === st._id.toString(),
      );

      return {
        id: st._id,
        title: st.title,
        task: st.task.title,
        client: st.task.client.name,
        status: st.status,
        estimatedHours: st.estimatedHours,
        loggedHours: st.loggedHours,
        hasOpenQuery,
      };
    });

    res.json({
      subtasks: formattedSubtasks,
      todayStats: {
        totalHours: (totalMinutes / 60).toFixed(2),
        logCount: todayLogs.length,
      },
      activeTimer: activeTimer
        ? {
            id: activeTimer._id,
            subtask: activeTimer.subtask,
            startTime: activeTimer.startTime,
            elapsed: Math.round(
              (Date.now() - activeTimer.startTime) / (1000 * 60),
            ), // minutes
          }
        : null,
      openQueries: openQueries.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR Dashboard
exports.getHRDashboard = async (req, res) => {
  try {
    // Pending time logs count
    const pendingLogsCount = await TimeLog.countDocuments({
      status: "PENDING",
      endTime: { $ne: null },
    });

    // Open queries count
    const openQueriesCount = await Query.countDocuments({
      status: { $ne: "CLOSED" },
    });

    // Today's work summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await TimeLog.find({
      date: { $gte: today, $lt: tomorrow },
      endTime: { $ne: null },
    });

    const totalMinutesToday = todayLogs.reduce(
      (sum, log) => sum + (log.duration || 0),
      0,
    );

    // Outstanding amount
    const clients = await Client.find({ isActive: true });
    let totalOutstanding = 0;

    for (const client of clients) {
      const lastEntry = await LedgerEntry.findOne({ client: client._id }).sort({
        date: -1,
      });
      if (lastEntry && lastEntry.balance > 0) {
        totalOutstanding += lastEntry.balance;
      }
    }

    res.json({
      pendingApprovals: pendingLogsCount,
      openQueries: openQueriesCount,
      todayStats: {
        totalHours: (totalMinutesToday / 60).toFixed(2),
        logCount: todayLogs.length,
      },
      outstanding: totalOutstanding.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
