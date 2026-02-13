const express = require("express");
const router = express.Router();
const { getEmployees } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleWares");

// GET /api/users/employees
/**
 * @swagger
 * /api/users/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 */
router.get("/employees", protect, getEmployees);

module.exports = router;
