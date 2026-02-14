const Billing = require("../models/billing");
const Payment = require("../models/payment");
const Client = require("../models/client");
const LedgerEntry = require("../models/ledgerEntry");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Helper function to update billing payment
async function updateBillingPayment(billingId, paymentAmount) {
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
}

// Get All Payments (HR)
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("client billing")
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create Manual Payment (HR)
exports.createManualPayment = async (req, res) => {
  try {
    const { clientId, billingId, amount, mode, reference } = req.body;

    const payment = await Payment.create({
      client: clientId,
      billing: billingId || undefined,
      amount: parseFloat(amount),
      mode,
      reference,
      status: "COMPLETED",
    });

    if (billingId) {
      await updateBillingPayment(billingId, parseFloat(amount));
    }

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
      credit: parseFloat(amount),
      balance: previousBalance - parseFloat(amount),
      reference: payment._id,
      referenceModel: "Payment",
    });

    await payment.populate("client billing");
    res.status(201).json(payment);
  } catch (err) {
    console.error("Manual payment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create Stripe Checkout Session (NEW - for shareable links)
exports.createCheckoutSession = async (req, res) => {
  console.log(" Request body:", req.body);
  console.log(" User:", req.user?._id);

  try {
    const { billingId } = req.body;
    console.log(" Billing ID:", billingId);

    if (!billingId) {
      console.log(" No billing ID provided");
      return res.status(400).json({ message: "billingId is required" });
    }

    console.log(" Finding billing...");
    const billing = await Billing.findById(billingId)
      .populate("client")
      .populate("task");

    console.log(" Billing found:", {
      id: billing?._id,
      invoiceNumber: billing?.invoiceNumber,
      hasClient: !!billing?.client,
      clientId: billing?.client?._id,
      isPaid: billing?.isPaid,
    });

    if (!billing) {
      console.log(" Billing not found");
      return res.status(404).json({ message: "Billing not found" });
    }

    if (!billing.client) {
      console.log(" Billing has no client");
      return res.status(400).json({
        message:
          "Invoice has no associated client. The client may have been deleted.",
      });
    }

    if (billing.isPaid) {
      console.log(" Billing already paid");
      return res.status(400).json({ message: "Invoice already paid" });
    }

    const amountInPaise = Math.round(billing.outstandingAmount * 100);
    console.log(" Amount in paise:", amountInPaise);

    if (!process.env.CLIENT_URL) {
      console.log(" CLIENT_URL not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    console.log("🔗 Creating Stripe session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Invoice ${billing.invoiceNumber}`,
              description: `${billing.task?.title || "Services"} - ${billing.client.name}`,
            },
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&billing_id=${billing._id}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel?billing_id=${billing._id}`,
      metadata: {
        billingId: billing._id.toString(),
        clientId: billing.client._id.toString(),
      },
      customer_email: billing.client.email || undefined,
    });

    console.log("✅ Stripe session created:", session.id);
    console.log("🔗 Payment URL:", session.url);

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Error type:", err.constructor.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      message: "Failed to create checkout session",
      error: err.message,
    });
  }
};
// Get public billing info (no auth)
exports.getPublicBillingInfo = async (req, res) => {
  try {
    const { billingId } = req.params;

    const billing = await Billing.findById(billingId)
      .populate("client", "name email")
      .populate("task", "title");

    if (!billing) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({
      invoiceNumber: billing.invoiceNumber,
      client: billing.client?.name || "Unknown",
      task: billing.task?.title || "Services",
      amount: billing.amount,
      outstandingAmount: billing.outstandingAmount,
      hours: billing.hours,
      ratePerHour: billing.ratePerHour,
      isPaid: billing.isPaid,
      date: billing.date,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify checkout session (no auth)
exports.verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status,
      billingId: session.metadata.billingId,
      amount: session.amount_total / 100,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Handle Stripe Webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status === "paid") {
      const billingId = session.metadata.billingId;
      const clientId = session.metadata.clientId;
      const amount = session.amount_total / 100;

      // Create payment record
      const payment = await Payment.create({
        client: clientId,
        billing: billingId,
        amount: amount,
        mode: "ONLINE",
        status: "COMPLETED",
        transactionId: session.payment_intent,
        provider: "stripe",
        rawResponse: session,
      });

      // Update billing
      await updateBillingPayment(billingId, amount);

      // Create ledger entry
      const lastEntry = await LedgerEntry.findOne({ client: clientId }).sort({
        date: -1,
      });
      const previousBalance = lastEntry ? lastEntry.balance : 0;

      await LedgerEntry.create({
        client: clientId,
        date: new Date(),
        description: `Online payment - Stripe (${session.payment_intent})`,
        type: "CREDIT",
        debit: 0,
        credit: amount,
        balance: previousBalance - amount,
        reference: payment._id,
        referenceModel: "Payment",
      });

      console.log("✅ Payment processed via webhook:", session.payment_intent);
    }
  }

  res.json({ received: true });
};
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "client billing",
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add this function if it doesn't exist
exports.createStripePayment = async (req, res) => {
  try {
    const { billingId, amount } = req.body;

    const amountInPaise = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      metadata: {
        billingId: billingId,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe payment error:", err);
    res.status(500).json({ message: err.message });
  }
};
