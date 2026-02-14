const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const timeLogController = require("../controllers/timeLogController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);

/**
 * @swagger
 * /api/timelogs/start:
 *   post:
 *     summary: Start work timer on a subtask
 *     tags: [TimeLogs]
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
 *             properties:
 *               subtaskId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a1
 *     responses:
 *       201:
 *         description: Timer started successfully
 *       400:
 *         description: Already have a running timer or open query
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Cannot log time on unassigned subtask
 *       404:
 *         description: Subtask not found
 */
router.post(
  "/start",
  [body("subtaskId").notEmpty()],
  timeLogController.startWork,
);

/**
 * @swagger
 * /api/timelogs/stop:
 *   post:
 *     summary: Stop work timer
 *     tags: [TimeLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timeLogId
 *             properties:
 *               timeLogId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a1
 *               remark:
 *                 type: string
 *                 example: Completed the homepage design
 *     responses:
 *       200:
 *         description: Timer stopped successfully
 *       400:
 *         description: Timer already stopped
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Time log not found
 */
router.post(
  "/stop",
  [body("timeLogId").notEmpty()],
  timeLogController.stopWork,
);
/**
 * @swagger
 * /api/timelogs/active:
 *   get:
 *     summary: Get active timelog
 *     tags: [TimeLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active timelog
 */
router.get("/active", timeLogController.getActiveTimer);
/**
 * @swagger
 * /api/timelogs/today:
 *   get:
 *     summary: Get today's timelogs
 *     tags: [TimeLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of today's timelogs
 */
router.get("/today", timeLogController.getTodayLogs);
/**
 * @swagger
 * /api/timelogs/pending:
 *   get:
 *     summary: Get all pending time logs (HR only)
 *     tags: [TimeLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending time logs
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 */
router.get("/pending", isHR, timeLogController.getPendingLogs);
/**
 * @swagger
 * /api/timelogs/{id}/approve:
 *   post:
 *     summary: Approve a time log (HR only)
 *     tags: [TimeLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Time log ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               editedHours:
 *                 type: number
 *                 example: 2.5
 *                 description: Optional - override logged hours
 *     responses:
 *       200:
 *         description: Time log approved
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Time log not found
 */
router.post("/:id/approve", isHR, timeLogController.approveTimeLog);
/**
 * @swagger
 * /api/timelogs/{id}/reject:
 *   post:
 *     summary: Reject a time log (HR only)
 *     tags: [TimeLogs]
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
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 example: Work not completed as per requirements
 *     responses:
 *       200:
 *         description: Time log rejected
 *       403:
 *         description: HR only
 *       404:
 *         description: Time log not found
 */
router.post(
  "/:id/reject",
  isHR,
  [body("rejectionReason").notEmpty()],
  timeLogController.rejectTimeLog,
);
/**
 * @swagger
 * /api/timelogs:
 *   get:
 *     summary: Get all timelogs
 *     tags: [TimeLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of timelogs
 */
router.get("/", timeLogController.getTimeLogs);
/**
 * @swagger
 * /api/timelogs/{id}/dismiss:
 *   post:
 *     summary: Dismiss a rejected time log (Employee only)
 *     tags: [TimeLogs]
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
 *         description: Rejected time log dismissed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Only rejected logs can be dismissed
 *       404:
 *         description: Time log not found
 */
router.post("/:id/dismiss", protect, timeLogController.dismissRejectedLog);

module.exports = router;
