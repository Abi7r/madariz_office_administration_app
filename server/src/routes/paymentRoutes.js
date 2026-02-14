const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

/**
 * @swagger
 * /payments/webhook/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Handles Stripe webhook events (no authentication required)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Webhook signature verification failed
 */
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  paymentController.handleStripeWebhook,
);

/**
 * @swagger
 * /payments/public/{billingId}:
 *   get:
 *     summary: Get public billing info for payment page
 *     description: Get invoice details without authentication (for client payment page)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: billingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Billing/Invoice ID
 *     responses:
 *       200:
 *         description: Billing information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceNumber:
 *                   type: string
 *                 client:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 outstandingAmount:
 *                   type: number
 *                 isPaid:
 *                   type: boolean
 *       404:
 *         description: Invoice not found
 */
router.get("/public/:billingId", paymentController.getPublicBillingInfo);

/**
 * @swagger
 * /payments/verify/{sessionId}:
 *   get:
 *     summary: Verify Stripe checkout session
 *     description: Check payment status after Stripe redirect (no authentication required)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe checkout session ID
 *     responses:
 *       200:
 *         description: Session status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: paid
 *                 billingId:
 *                   type: string
 *                 amount:
 *                   type: number
 */
router.get("/verify/:sessionId", paymentController.verifyCheckoutSession);

// ==============================================
// PROTECTED ROUTES (Authentication required)
// ==============================================

// Apply authentication middleware to all routes below
router.use(protect);
router.use(isHR);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     description: Get list of all payments (HR only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (HR only)
 */
router.get("/", paymentController.getPayments);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Get single payment details (HR only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (HR only)
 */
router.get("/:id", paymentController.getPaymentById);

/**
 * @swagger
 * /payments/manual:
 *   post:
 *     summary: Record manual payment
 *     description: Record a manual payment (cash/bank/UPI) - HR only
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - amount
 *               - mode
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               billingId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: Optional - link to specific invoice
 *               amount:
 *                 type: number
 *                 example: 5000
 *               mode:
 *                 type: string
 *                 enum: [CASH, BANK, UPI]
 *                 example: BANK
 *               reference:
 *                 type: string
 *                 example: "TXN123456"
 *                 description: Transaction reference number
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (HR only)
 */
router.post(
  "/manual",
  [
    body("clientId").notEmpty().withMessage("Client ID is required"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("mode")
      .isIn(["CASH", "BANK", "UPI"])
      .withMessage("Invalid payment mode"),
  ],
  paymentController.createManualPayment,
);

// router.post(
//   "/stripe/create",
//   [
//     body("billingId").notEmpty().withMessage("Billing ID is required"),
//     body("amount").isNumeric().withMessage("Amount must be a number"),
//   ],
//   paymentController.createStripePayment,
// );

/**
 * @swagger
 * /payments/stripe/checkout:
 *   post:
 *     summary: Create Stripe checkout session (shareable link)
 *     description: Generate a shareable Stripe checkout link for client payment (HR only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - billingId
 *             properties:
 *               billingId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: Invoice/Billing ID to create payment link for
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "cs_test_xxxxxxxxxxxxx"
 *                 url:
 *                   type: string
 *                   example: "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
 *                   description: Shareable payment link for client
 *       400:
 *         description: Invalid request or invoice already paid
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (HR only)
 */
router.post(
  "/stripe/checkout",
  [body("billingId").notEmpty().withMessage("Billing ID is required")],
  paymentController.createCheckoutSession,
);
/**
 * @swagger
 * /payments/{id}/receipt:
 *   get:
 *     summary: Download payment receipt (PDF)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF receipt file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/:id/receipt", protect, paymentController.downloadReceipt);

// Or use query parameter approach:
// GET /api/payments/:id?format=pdf
router.get("/:id", paymentController.getPaymentById);

module.exports = router;
