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

router.get("/:id", subtaskController.getSubtaskById);
router.put("/:id", isHR, subtaskController.updateSubtask);
router.delete("/:id", isHR, subtaskController.deleteSubtask);

module.exports = router;
