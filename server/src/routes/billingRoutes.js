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

router.get("/", billingController.getBillings);
router.get("/outstanding", billingController.getOutstandingBillings);
router.get("/:id", billingController.getBillingById);

module.exports = router;
