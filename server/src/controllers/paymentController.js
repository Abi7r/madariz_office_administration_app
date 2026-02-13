const Payment = require("../models/payment");
const Billing = require("../models/billing");
const LedgerEntry = require("../models/ledgerEntry");
const { validationResult } = require("express-validator");
const { updateBillingPayment } = require("./billingController");
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

// Create Manual Payment (HR)
exports.createManualPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, billingId, amount, mode, reference } = req.body;

    // Create payment record
    const payment = await Payment.create({
      client: clientId,
      billing: billingId || null,
      amount,
      mode,
      reference,
      status: "COMPLETED",
      createdBy: req.user.id,
    });

    // Update billing if provided
    if (billingId) {
      await updateBillingPayment(billingId, amount);
    }

    // Create ledger entry (CREDIT)
    const lastEntry = await LedgerEntry.findOne({ client: clientId }).sort({
      date: -1,
    });
    const previousBalance = lastEntry ? lastEntry.balance : 0;

    await LedgerEntry.create({
      client: clientId,
      date: new Date(),
      description: `Payment received - ${mode} ${reference ? `(${reference})` : ""}`,
      type: "CREDIT",
      debit: 0,
      credit: amount,
      balance: previousBalance - amount,
      reference: payment._id,
      referenceModel: "Payment",
    });

    await payment.populate("client billing createdBy");

    res.status(201).json({
      message: "Payment recorded successfully",
      payment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create Stripe Payment Intent (for online payment)
exports.createStripePayment = async (req, res) => {
  try {
    const { billingId, amount } = req.body;

    const billing = await Billing.findById(billingId).populate("client");
    if (!billing) {
      return res.status(404).json({ message: "Billing not found" });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "inr", // Change as needed
      metadata: {
        billingId: billing._id.toString(),
        clientId: billing.client._id.toString(),
        invoiceNumber: billing.invoiceNumber,
      },
    });

    // Create pending payment record
    const payment = await Payment.create({
      client: billing.client._id,
      billing: billingId,
      amount,
      mode: "ONLINE",
      status: "PENDING",
      transactionId: paymentIntent.id,
      provider: "stripe",
      rawResponse: paymentIntent,
    });

    res.json({
      message: "Payment intent created",
      clientSecret: paymentIntent.client_secret,
      payment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Stripe Webhook Handler
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // Find the payment record
    const payment = await Payment.findOne({
      transactionId: paymentIntent.id,
    });

    if (payment) {
      payment.status = "COMPLETED";
      payment.rawResponse = paymentIntent;
      await payment.save();

      // Update billing
      if (payment.billing) {
        await updateBillingPayment(payment.billing, payment.amount);
      }

      // Create ledger entry
      const lastEntry = await LedgerEntry.findOne({
        client: payment.client,
      }).sort({ date: -1 });

      const previousBalance = lastEntry ? lastEntry.balance : 0;

      await LedgerEntry.create({
        client: payment.client,
        date: new Date(),
        description: `Online payment received - Stripe (${paymentIntent.id})`,
        type: "CREDIT",
        debit: 0,
        credit: payment.amount,
        balance: previousBalance - payment.amount,
        reference: payment._id,
        referenceModel: "Payment",
      });
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    const payment = await Payment.findOne({
      transactionId: paymentIntent.id,
    });

    if (payment) {
      payment.status = "FAILED";
      payment.rawResponse = paymentIntent;
      await payment.save();
    }
  }

  res.json({ received: true });
};

// Get All Payments
exports.getPayments = async (req, res) => {
  try {
    const { client, billing, status, mode } = req.query;
    const filter = {};

    if (client) filter.client = client;
    if (billing) filter.billing = billing;
    if (status) filter.status = status;
    if (mode) filter.mode = mode;

    const payments = await Payment.find(filter)
      .populate("client billing createdBy")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Single Payment
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "client billing createdBy",
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
