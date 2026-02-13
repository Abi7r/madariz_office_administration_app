const Query = require("../models/query");
const Subtask = require("../models/subtask");
const TimeLog = require("../models/timeLog");
const { validationResult } = require("express-validator");

// Raise Query (Employee)
exports.raiseQuery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subtaskId, message, type, priority } = req.body;

    // Verify subtask exists and is assigned to user
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    if (subtask.assignedTo.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Cannot raise query on unassigned subtask" });
    }

    // Check if there's already an open query
    const existingQuery = await Query.findOne({
      subtask: subtaskId,
      status: { $ne: "CLOSED" },
    });

    if (existingQuery) {
      return res.status(400).json({
        message: "An open query already exists for this subtask",
        query: existingQuery,
      });
    }

    // Create query
    const query = await Query.create({
      subtask: subtaskId,
      raisedBy: req.user.id,
      message,
      type,
      priority,
    });

    // Update subtask status to ON_HOLD
    await Subtask.findByIdAndUpdate(subtaskId, { status: "ON_HOLD" });

    // Stop any running timer for this subtask
    await TimeLog.updateMany(
      {
        subtask: subtaskId,
        employee: req.user.id,
        endTime: null,
      },
      {
        endTime: new Date(),
        remark: "Auto-stopped due to query raised",
      },
    );

    await query.populate("subtask raisedBy");

    res.status(201).json({
      message: "Query raised successfully. Subtask is now on hold.",
      query,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Queries
exports.getQueries = async (req, res) => {
  try {
    const { status, subtask, priority } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (subtask) filter.subtask = subtask;
    if (priority) filter.priority = priority;

    // If employee, show only their queries
    if (req.user.role === "EMPLOYEE") {
      filter.raisedBy = req.user.id;
    }

    const queries = await Query.find(filter)
      .populate("subtask raisedBy repliedBy closedBy")
      .sort({ createdAt: -1 });

    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Single Query
exports.getQueryById = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id).populate(
      "subtask raisedBy repliedBy closedBy",
    );

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    res.json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reply to Query (HR)
exports.replyToQuery = async (req, res) => {
  try {
    const { reply } = req.body;

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    query.reply = reply;
    query.status = "REPLIED";
    query.repliedBy = req.user.id;
    query.repliedAt = new Date();

    await query.save();
    await query.populate("subtask raisedBy repliedBy closedBy");

    res.json({
      message: "Reply sent successfully",
      query,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Close Query (HR)
exports.closeQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    query.status = "CLOSED";
    query.closedBy = req.user.id;
    query.closedAt = new Date();

    await query.save();

    // Update subtask status back to PENDING (employee can now work)
    const subtask = await Subtask.findById(query.subtask);
    if (subtask.status === "ON_HOLD") {
      subtask.status = "PENDING";
      await subtask.save();
    }

    await query.populate("subtask raisedBy repliedBy closedBy");

    res.json({
      message: "Query closed. Employee can now resume work.",
      query,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reassign Query (HR)
exports.reassignQuery = async (req, res) => {
  try {
    const { newAssignee } = req.body;

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    // Update subtask assignment
    await Subtask.findByIdAndUpdate(query.subtask, {
      assignedTo: newAssignee,
    });

    // Close the query
    query.status = "CLOSED";
    query.closedBy = req.user.id;
    query.closedAt = new Date();
    query.reply = `Reassigned to another employee`;

    await query.save();
    await query.populate("subtask raisedBy repliedBy closedBy");

    res.json({
      message: "Query closed and subtask reassigned",
      query,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
