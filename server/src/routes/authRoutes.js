const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@company.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [EMPLOYEE, HR]
 *                 example: HR
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Role mismatch
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role").isIn(["EMPLOYEE", "HR"]).withMessage("Invalid role"),
  ],
  authController.login,
);

module.exports = router;

// const express = require("express");
// const { body } = require("express-validator");
// const authController = require("../controllers/authController");

// const router = express.Router();

// router.post(
//   "/login",
//   [
//     body("email").isEmail().withMessage("Valid email required"),
//     body("password").notEmpty().withMessage("Password required"),
//     body("role").isIn(["EMPLOYEE", "HR"]).withMessage("Invalid role"),
//   ],
//   authController.login,
// );

// module.exports = router;
