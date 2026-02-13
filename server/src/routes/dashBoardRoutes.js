const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleWares");

router.use(protect);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard based on user role
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subtasks:
 *                   type: array
 *                 todayStats:
 *                   type: object
 *                 activeTimer:
 *                   type: object
 *                 pendingApprovals:
 *                   type: number
 *                 outstanding:
 *                   type: number
 *       401:
 *         description: Not authorized
 */
router.get("/", (req, res) => {
  if (req.user.role === "EMPLOYEE") {
    return dashboardController.getEmployeeDashboard(req, res);
  } else {
    return dashboardController.getHRDashboard(req, res);
  }
});

router.get("/employee", dashboardController.getEmployeeDashboard);
router.get("/hr", dashboardController.getHRDashboard);

module.exports = router;
