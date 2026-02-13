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

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   client:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   totalEstimatedHours:
 *                     type: number
 *                   status:
 *                     type: string
 */
router.get("/", taskController.getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
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
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get("/:id", taskController.getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task (HR only)
 *     tags: [Tasks]
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
 *               client:
 *                 type: string
 *               totalEstimatedHours:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Task not found
 */
router.put("/:id", isHR, taskController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task (HR only)
 *     tags: [Tasks]
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
 *         description: Task deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: HR only
 *       404:
 *         description: Task not found
 */
router.delete("/:id", isHR, taskController.deleteTask);

module.exports = router;
