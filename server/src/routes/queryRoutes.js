const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const queryController = require("../controllers/queryController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);

/**
 * @swagger
 * /api/queries:
 *   post:
 *     summary: Raise a query (Employee)
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subtaskId
 *               - message
 *               - type
 *               - priority
 *             properties:
 *               subtaskId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a1
 *               message:
 *                 type: string
 *                 example: Need clarification on the design requirements
 *               type:
 *                 type: string
 *                 enum: [CLARIFICATION, BLOCKER, APPROVAL_NEEDED]
 *                 example: CLARIFICATION
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: MEDIUM
 *     responses:
 *       201:
 *         description: Query raised successfully
 *       400:
 *         description: Open query already exists for this subtask
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Cannot raise query on unassigned subtask
 *       404:
 *         description: Subtask not found
 */
router.post(
  "/",
  [
    body("subtaskId").notEmpty(),
    body("message").notEmpty(),
    body("type").isIn(["CLARIFICATION", "BLOCKER", "APPROVAL_NEEDED"]),
    body("priority").isIn(["LOW", "MEDIUM", "HIGH"]),
  ],
  queryController.raiseQuery,
);

router.get("/", queryController.getQueries);
router.get("/:id", queryController.getQueryById);

/**
 * @swagger
 * /api/queries/{id}/reply:
 *   post:
 *     summary: Reply to a query (HR only)
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: Please proceed with option B
 *     responses:
 *       200:
 *         description: Reply sent successfully
 *       403:
 *         description: HR only
 *       404:
 *         description: Query not found
 */
router.post(
  "/:id/reply",
  isHR,
  [body("reply").notEmpty()],
  queryController.replyToQuery,
);

/**
 * @swagger
 * /api/queries/{id}/close:
 *   post:
 *     summary: Close a query (HR only)
 *     tags: [Queries]
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
 *         description: Query closed
 *       403:
 *         description: HR only
 *       404:
 *         description: Query not found
 */
router.post("/:id/close", isHR, queryController.closeQuery);

/**
 * @swagger
 * /api/queries/{id}/reassign:
 *   post:
 *     summary: Reassign a query (HR only)
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAssignee
 *             properties:
 *               newAssignee:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a2
 *     responses:
 *       200:
 *         description: Query reassigned
 *       403:
 *         description: HR only
 *       404:
 *         description: Query not found
 */
router.post(
  "/:id/reassign",
  isHR,
  [body("newAssignee").notEmpty()],
  queryController.reassignQuery,
);

module.exports = router;
