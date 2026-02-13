const Task = require("../models/task");
const Subtask = require("../models/subtask");
const { validationResult } = require("express-validator");

// Create Task (HR only)
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.create({
      ...req.body,
      createdBy: req.user.id,
    });

    await task.populate("client createdBy");

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    const { client, status } = req.query;
    const filter = {};

    if (client) filter.client = client;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate("client createdBy")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Single Task
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "client createdBy",
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtasks = await Subtask.find({ task: task._id }).populate(
      "assignedTo",
    );

    res.json({
      task,
      subtasks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("client createdBy");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Subtask.deleteMany({ task: task._id });

    res.json({ message: "Task and associated subtasks deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status based on subtask completion
exports.updateTaskStatus = async (taskId) => {
  const subtasks = await Subtask.find({ task: taskId });

  if (subtasks.length === 0) {
    return;
  }

  const allCompleted = subtasks.every((st) => st.status === "COMPLETED");
  const anyInProgress = subtasks.some((st) => st.status === "IN_PROGRESS");
  const anyOnHold = subtasks.some((st) => st.status === "ON_HOLD");

  let status = "PENDING";
  if (allCompleted) {
    status = "COMPLETED";
  } else if (anyOnHold) {
    status = "ON_HOLD";
  } else if (anyInProgress) {
    status = "IN_PROGRESS";
  }

  const totalLoggedHours = subtasks.reduce(
    (sum, st) => sum + (st.loggedHours || 0),
    0,
  );

  await Task.findByIdAndUpdate(taskId, {
    status,
    totalLoggedHours,
  });
};
