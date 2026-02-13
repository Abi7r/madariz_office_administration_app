const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const subtaskController = require("../controllers/subTaskController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);

/**
 * @swagger
 * /api/subtasks:
 *   post:
 *     summary: Create a new subtask (HR only)
 *     tags: [Subtasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - task
 *               - assignedTo
 *               - estimatedHours
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design homepage mockup
 *               description:
 *                 type: string
 *                 example: Create wireframes and mockups for the homepage
 *               task:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a1
 *               assignedTo:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a2
 *               estimatedHours:
 *                 type: number
 *                 example: 8
 *     responses:
 *       201:
 *         description: Subtask created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Task not found
 */
router.post(
  "/",
  isHR,
  [
    body("title").notEmpty(),
    body("task").notEmpty(),
    body("assignedTo").notEmpty(),
    body("estimatedHours").isNumeric(),
  ],
  subtaskController.createSubtask,
);
/**
 * @swagger
 * /api/subtasks:
 *   get:
 *     summary: Get all subtasks
 *     tags: [Subtasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subtasks
 */

router.get("/", subtaskController.getSubtasks);

/**
 * @swagger
 * /api/subtasks/my:
 *   get:
 *     summary: Get my assigned subtasks (Employee)
 *     tags: [Subtasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned subtasks
 *       401:
 *         description: Not authorized
 */
router.get("/my", subtaskController.getMySubtasks);
/**
 * @swagger
 * /api/subtasks/{id}:
 *   get:
 *     summary: Get subtask by ID
 *     tags: [Subtasks]
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
 *         description: Subtask details
 */
router.get("/:id", subtaskController.getSubtaskById);
/**
 * @swagger
 * /api/subtasks/{id}:
 *   put:
 *     summary: Update subtask (HR only)
 *     tags: [Subtasks]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               task:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               estimatedHours:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Subtask not found
 */
router.put("/:id", isHR, subtaskController.updateSubtask);
/**
 * @swagger
 * /api/subtasks/{id}:
 *   delete:
 *     summary: Delete subtask (HR only)
 *     tags: [Subtasks]
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
 *         description: Subtask deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Subtask not found
 */
router.delete("/:id", isHR, subtaskController.deleteSubtask);

module.exports = router;
