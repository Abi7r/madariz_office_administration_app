const mongoose = require("mongoose");

const User = require("./models/user");
const Client = require("./models/client");
const Task = require("./models/task");
const Subtask = require("./models/subtask");
const TimeLog = require("./models/timeLog");
const Billing = require("./models/billing");
const Payment = require("./models/payment");
const LedgerEntry = require("./models/ledgerEntry");

mongoose.connect(process.env.MONGODB_URI);

async function seed() {
  try {
    console.log("Clearing old data...");

    await Promise.all([
      User.deleteMany(),
      Client.deleteMany(),
      Task.deleteMany(),
      Subtask.deleteMany(),
      TimeLog.deleteMany(),
      Billing.deleteMany(),
      Payment.deleteMany(),
      LedgerEntry.deleteMany(),
    ]);

    console.log("Creating users...");

    const users = await User.create([
      {
        name: "HR Admin",
        email: "hr@company.com",
        password: "password123",
        role: "HR",
      },
      {
        name: "John Employee",
        email: "john@company.com",
        password: "password123",
        role: "EMPLOYEE",
      },
      {
        name: "Jane Employee",
        email: "jane@company.com",
        password: "password123",
        role: "EMPLOYEE",
      },
    ]);

    const hr = users[0];
    const john = users[1];

    console.log("Creating client...");

    const client = await Client.create({
      name: "Acme Technologies",
      email: "contact@acme.com",
      hourlyRate: 1500,
    });

    console.log("Creating task...");

    const task = await Task.create({
      title: "Website Development",
      client: client._id,
      createdBy: hr._id,
      totalEstimatedHours: 20,
    });

    console.log("Creating subtask...");

    const subtask = await Subtask.create({
      title: "Build Authentication Module",
      task: task._id,
      assignedTo: john._id,
      estimatedHours: 10,
      createdBy: hr._id,
    });

    console.log("Creating timelog...");

    const timeLog = await TimeLog.create({
      subtask: subtask._id,
      employee: john._id,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(),
      duration: 120,
      status: "APPROVED",
      approvedBy: hr._id,
      approvedAt: new Date(),
      date: new Date(),
    });

    const hours = timeLog.duration / 60;
    const amount = hours * client.hourlyRate;

    console.log("Creating billing...");

    const billing = await Billing.create({
      client: client._id,
      task: task._id,
      timeLogs: [timeLog._id],
      hours,
      ratePerHour: client.hourlyRate,
      amount,
      createdBy: hr._id,
      paidAmount: 1000,
    });

    console.log("Creating payment...");

    const payment = await Payment.create({
      client: client._id,
      billing: billing._id,
      amount: 1000,
      mode: "BANK",
      createdBy: hr._id,
    });

    console.log("Creating ledger entries...");

    const debitEntry = await LedgerEntry.create({
      client: client._id,
      description: "Invoice raised",
      type: "DEBIT",
      debit: amount,
      balance: amount,
      reference: billing._id,
      referenceModel: "Billing",
    });

    await LedgerEntry.create({
      client: client._id,
      description: "Payment received",
      type: "CREDIT",
      credit: 1000,
      balance: amount - 1000,
      reference: payment._id,
      referenceModel: "Payment",
    });

    console.log("Seeding completed successfully 🌱");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
