const Billing = require("../models/billing");
const TimeLog = require("../models/timeLog");
const Client = require("../models/client");
const LedgerEntry = require("../models/ledgerEntry");
const { validationResult } = require("express-validator");

// Create Billing/Invoice from Approved Logs (HR)
// exports.createBilling = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { clientId, taskId, timeLogIds, ratePerHour } = req.body;

//     // Verify client exists
//     const client = await Client.findById(clientId);
//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     // Get time logs - must be approved
//     const timeLogs = await TimeLog.find({
//       _id: { $in: timeLogIds },
//       status: "APPROVED",
//     }).populate("subtask");

//     if (timeLogs.length === 0) {
//       return res.status(400).json({
//         message:
//           "No approved time logs found. Billing can only be created from approved logs.",
//       });
//     }

//     if (timeLogs.length !== timeLogIds.length) {
//       return res.status(400).json({
//         message: "Some time logs are not approved or don't exist",
//       });
//     }

//     // Verify all logs belong to the same task
//     const taskIds = [
//       ...new Set(timeLogs.map((log) => log.subtask.task.toString())),
//     ];
//     if (taskIds.length > 1) {
//       return res.status(400).json({
//         message: "All time logs must belong to the same task",
//       });
//     }

//     // Calculate total hours
//     const totalMinutes = timeLogs.reduce((sum, log) => {
//       const hours =
//         log.editedHours !== undefined ? log.editedHours : log.duration / 60;
//       return sum + hours * 60;
//     }, 0);
//     const totalHours = (totalMinutes / 60).toFixed(2);

//     // Use provided rate or client's default rate
//     const rate = ratePerHour || client.hourlyRate;
//     const amount = (totalHours * rate).toFixed(2);

//     // Create billing
//     const billing = await Billing.create({
//       client: clientId,
//       task: taskId,
//       timeLogs: timeLogIds,
//       hours: totalHours,
//       ratePerHour: rate,
//       amount: parseFloat(amount),
//       createdBy: req.user.id,
//     });

//     // Create ledger entry (DEBIT)
//     const lastEntry = await LedgerEntry.findOne({ client: clientId }).sort({
//       date: -1,
//     });
//     const previousBalance = lastEntry ? lastEntry.balance : 0;

//     await LedgerEntry.create({
//       client: clientId,
//       date: new Date(),
//       description: `Invoice ${billing.invoiceNumber} - Task`,
//       type: "DEBIT",
//       debit: parseFloat(amount),
//       credit: 0,
//       balance: previousBalance + parseFloat(amount),
//       reference: billing._id,
//       referenceModel: "Billing",
//     });

//     await billing.populate("client task timeLogs createdBy");

//     res.status(201).json({
//       message: "Billing created successfully",
//       billing,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// Create Billing/Invoice from Approved Logs (HR)
exports.createBilling = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, taskId, timeLogIds, ratePerHour } = req.body;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get time logs - must be approved
    const timeLogs = await TimeLog.find({
      _id: { $in: timeLogIds },
      status: "APPROVED",
    }).populate({
      path: "subtask",
      populate: { path: "task" }, // ADD THIS - populate task inside subtask
    });

    if (timeLogs.length === 0) {
      return res.status(400).json({
        message:
          "No approved time logs found. Billing can only be created from approved logs.",
      });
    }

    if (timeLogs.length !== timeLogIds.length) {
      return res.status(400).json({
        message: "Some time logs are not approved or don't exist",
      });
    }

    // Verify all logs belong to the same task
    const taskIds = [
      ...new Set(
        timeLogs.map((log) => log.subtask?.task?._id?.toString() || ""),
      ),
    ].filter(Boolean);

    if (taskIds.length > 1) {
      return res.status(400).json({
        message: "All time logs must belong to the same task",
      });
    }

    // Calculate total hours
    const totalMinutes = timeLogs.reduce((sum, log) => {
      const hours =
        log.editedHours !== undefined ? log.editedHours : log.duration / 60;
      return sum + hours * 60;
    }, 0);
    const totalHours = (totalMinutes / 60).toFixed(2);

    // Use provided rate or client's default rate
    const rate = ratePerHour || client.hourlyRate;
    const amount = (totalHours * rate).toFixed(2);

    // Create billing
    const billing = await Billing.create({
      client: clientId,
      task: taskId,
      timeLogs: timeLogIds,
      hours: totalHours,
      ratePerHour: rate,
      amount: parseFloat(amount),
      createdBy: req.user.id,
    });

    // Update time logs with billed amount
    for (const log of timeLogs) {
      const logHours =
        log.editedHours !== undefined ? log.editedHours : log.duration / 60;
      const logAmount = logHours * rate;
      await TimeLog.findByIdAndUpdate(log._id, { billedAmount: logAmount });
    }

    // Create ledger entry (DEBIT) - ONLY ONCE, WHEN BILLING IS CREATED
    const lastEntry = await LedgerEntry.findOne({ client: clientId }).sort({
      date: -1,
    });
    const previousBalance = lastEntry ? lastEntry.balance : 0;

    await LedgerEntry.create({
      client: clientId,
      date: new Date(),
      description: `Invoice ${billing.invoiceNumber} - Task`,
      type: "DEBIT",
      debit: parseFloat(amount),
      credit: 0,
      balance: previousBalance + parseFloat(amount),
      reference: billing._id,
      referenceModel: "Billing",
    });

    await billing.populate("client task timeLogs createdBy");

    res.status(201).json({
      message: "Billing created successfully",
      billing,
    });
  } catch (err) {
    console.error("Billing creation error:", err);
    res.status(500).json({ message: err.message });
  }
};
// Get All Billings
exports.getBillings = async (req, res) => {
  try {
    const { client, isPaid } = req.query;
    const filter = {};

    if (client) filter.client = client;
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";

    const billings = await Billing.find(filter)
      .populate("client task createdBy")
      .sort({ createdAt: -1 });

    res.json(billings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Single Billing
exports.getBillingById = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id).populate(
      "client task timeLogs createdBy",
    );

    if (!billing) {
      return res.status(404).json({ message: "Billing not found" });
    }

    res.json(billing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Outstanding Billings
exports.getOutstandingBillings = async (req, res) => {
  try {
    const { client } = req.query;
    const filter = { isPaid: false };

    if (client) filter.client = client;

    const billings = await Billing.find(filter)
      .populate("client task")
      .sort({ createdAt: -1 });

    const totalOutstanding = billings.reduce(
      (sum, bill) => sum + bill.outstandingAmount,
      0,
    );

    res.json({
      billings,
      totalOutstanding: totalOutstanding.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Billing Payment Status (used by payment controller)
exports.updateBillingPayment = async (billingId, paymentAmount) => {
  try {
    const billing = await Billing.findById(billingId);
    if (!billing) return;

    billing.paidAmount += paymentAmount;
    billing.outstandingAmount = billing.amount - billing.paidAmount;

    if (billing.paidAmount >= billing.amount) {
      billing.isPaid = true;
    }

    await billing.save();
    return billing;
  } catch (err) {
    console.error("Error updating billing payment:", err);
  }
};
