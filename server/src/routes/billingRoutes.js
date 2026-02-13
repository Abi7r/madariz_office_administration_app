const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const billingController = require("../controllers/billingController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);
router.use(isHR);

/**
 * @swagger
 * /api/billings:
 *   post:
 *     summary: Create billing/invoice from approved logs (HR only)
 *     tags: [Billing]
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
 *               - taskId
 *               - timeLogIds
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a1
 *               taskId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a2
 *               timeLogIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ec49f1b2c8b1f8c8e8a3", "60d5ec49f1b2c8b1f8c8e8a4"]
 *               ratePerHour:
 *                 type: number
 *                 example: 1500
 *     responses:
 *       201:
 *         description: Billing created successfully
 *       400:
 *         description: No approved time logs found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Client not found
 */
router.post(
  "/",
  [
    body("clientId").notEmpty(),
    body("taskId").notEmpty(),
    body("timeLogIds").isArray().notEmpty(),
  ],
  billingController.createBilling,
);
/**
 * @swagger
 * /api/billings:
 *   get:
 *     summary: Get all billings
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all billings
 */
router.get("/", billingController.getBillings);
/**
 * @swagger
 * /api/billings/outstanding:
 *   get:
 *     summary: Get outstanding billings
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of outstanding billings
 */
router.get("/outstanding", billingController.getOutstandingBillings);
/**
 * @swagger
 * /api/billings/{id}:
 *   get:
 *     summary: Get billing by ID
 *     tags: [Billing]
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
 *         description: Billing details
 */
router.get("/:id", billingController.getBillingById);

module.exports = router;
