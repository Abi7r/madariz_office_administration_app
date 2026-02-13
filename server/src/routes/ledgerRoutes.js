const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/ledgerController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);
router.use(isHR);

/**
 * @swagger
 * /api/ledger/client/{clientId}:
 *   get:
 *     summary: Get client ledger/statement (HR only)
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the client
 *     responses:
 *       200:
 *         description: Client ledger retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 *                   example: "12345"
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2026-02-01"
 *                       description:
 *                         type: string
 *                         example: "Payment received"
 *                       amount:
 *                         type: number
 *                         example: 5000
 *                       balance:
 *                         type: number
 *                         example: 15000
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Client not found
 */

/**
 * @swagger
 * /api/ledger/outstanding:
 *   get:
 *     summary: Get all clients with outstanding balance (HR only)
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients with outstanding balances
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   clientId:
 *                     type: string
 *                     example: "12345"
 *                   clientName:
 *                     type: string
 *                     example: "ABC Corp"
 *                   outstandingBalance:
 *                     type: number
 *                     example: 7500
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 */

router.get("/client/:clientId", ledgerController.getClientLedger);

router.get("/outstanding", ledgerController.getAllOutstanding);

module.exports = router;
