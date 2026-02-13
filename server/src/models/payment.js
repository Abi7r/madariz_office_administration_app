const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    billing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
    },
    amount: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ["CASH", "BANK", "UPI", "ONLINE"],
      required: true,
    },
    reference: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
    transactionId: {
      type: String,
    },
    provider: {
      type: String,
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

paymentSchema.index({ client: 1, date: -1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
