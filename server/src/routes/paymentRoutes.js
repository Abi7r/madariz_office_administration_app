const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

/**
 * @swagger
 * /api/payments/webhook/stripe:
 *   post:
 *     summary: Stripe webhook endpoint (No auth required)
 *     tags: [Payments]
 */
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook,
);

router.use(protect);
router.use(isHR);

/**
 * @swagger
 * /api/payments/manual:
 *   post:
 *     summary: Create manual payment (HR only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: "12345"
 *               amount:
 *                 type: number
 *                 example: 5000
 *               mode:
 *                 type: string
 *                 enum: [CASH, BANK, UPI]
 *                 example: "CASH"
 *     responses:
 *       200:
 *         description: Manual payment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 */
router.post(
  "/manual",
  [
    body("clientId").notEmpty(),
    body("amount").isNumeric(),
    body("mode").isIn(["CASH", "BANK", "UPI"]),
  ],
  paymentController.createManualPayment,
);

/**
 * @swagger
 * /api/payments/stripe/create:
 *   post:
 *     summary: Create Stripe payment intent (HR only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billingId:
 *                 type: string
 *                 example: "BILL-001"
 *               amount:
 *                 type: number
 *                 example: 2500
 *     responses:
 *       200:
 *         description: Stripe payment intent created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 */
router.post(
  "/stripe/create",
  [body("billingId").notEmpty(), body("amount").isNumeric()],
  paymentController.createStripePayment,
);

router.get("/", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);

module.exports = router;
