const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    timeLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TimeLog",
      },
    ],
    hours: {
      type: Number,
      required: true,
    },
    ratePerHour: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
    },
  },
  { timestamps: true },
);

// Auto-generate invoice number and calculate outstanding
billingSchema.pre("save", async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Billing").countDocuments();
    this.invoiceNumber = `INV-${Date.now()}-${count + 1}`;
  }

  this.outstandingAmount = this.amount - this.paidAmount;

  if (this.paidAmount >= this.amount) {
    this.isPaid = true;
  }
});

module.exports = mongoose.model("Billing", billingSchema);
