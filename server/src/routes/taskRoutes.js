const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const taskController = require("../controllers/taskController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task (HR only)
 *     tags: [Tasks]
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
 *               - client
 *             properties:
 *               title:
 *                 type: string
 *                 example: Website Redesign
 *               description:
 *                 type: string
 *                 example: Complete redesign of client website
 *               client:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8a1
 *               totalEstimatedHours:
 *                 type: number
 *                 example: 40
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 */
router.post(
  "/",
  isHR,
  [
    body("title").notEmpty().withMessage("Task title is required"),
    body("client").notEmpty().withMessage("Client is required"),
  ],
  taskController.createTask,
);

router.get("/", taskController.getTasks);
router.get("/:id", taskController.getTaskById);
router.put("/:id", isHR, taskController.updateTask);
router.delete("/:id", isHR, taskController.deleteTask);

module.exports = router;
