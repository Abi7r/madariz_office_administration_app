const Subtask = require("../models/subtask");
const Task = require("../models/task");
const Query = require("../models/query");
const { validationResult } = require("express-validator");
const { updateTaskStatus } = require("./taskController");

// Create Subtask (HR only)
exports.createSubtask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.body.task);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtask = await Subtask.create({
      ...req.body,
      createdBy: req.user.id,
    });

    await subtask.populate("task assignedTo createdBy");

    const subtasks = await Subtask.find({ task: task._id });
    const totalEstimatedHours = subtasks.reduce(
      (sum, st) => sum + st.estimatedHours,
      0,
    );
    await Task.findByIdAndUpdate(task._id, { totalEstimatedHours });

    res.status(201).json({
      message: "Subtask created successfully",
      subtask,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Subtasks
exports.getSubtasks = async (req, res) => {
  try {
    const { task, assignedTo, status } = req.query;
    const filter = {};

    if (task) filter.task = task;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;

    const subtasks = await Subtask.find(filter)
      .populate("task assignedTo createdBy")
      .sort({ createdAt: -1 });

    res.json(subtasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Employee's Assigned Subtasks
exports.getMySubtasks = async (req, res) => {
  try {
    const subtasks = await Subtask.find({ assignedTo: req.user.id })
      .populate({
        path: "task",
        populate: { path: "client" },
      })
      .sort({ createdAt: -1 });

    res.json(subtasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Single Subtask
exports.getSubtaskById = async (req, res) => {
  try {
    const subtask = await Subtask.findById(req.params.id).populate(
      "task assignedTo createdBy",
    );

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    const openQuery = await Query.findOne({
      subtask: subtask._id,
      status: { $ne: "CLOSED" },
    });

    res.json({
      subtask,
      hasOpenQuery: !!openQuery,
      openQuery,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Subtask
exports.updateSubtask = async (req, res) => {
  try {
    const subtask = await Subtask.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("task assignedTo createdBy");

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    await updateTaskStatus(subtask.task._id);

    res.json({
      message: "Subtask updated successfully",
      subtask,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Subtask
exports.deleteSubtask = async (req, res) => {
  try {
    const subtask = await Subtask.findByIdAndDelete(req.params.id);

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    await updateTaskStatus(subtask.task);

    res.json({ message: "Subtask deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
