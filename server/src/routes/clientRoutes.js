const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const clientController = require("../controllers/clientController");
const { protect, isHR } = require("../middlewares/authMiddleWares");

router.use(protect);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client (HR only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - hourlyRate
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.post(
  "/",
  isHR,
  [
    body("name").notEmpty().withMessage("Client name is required"),
    body("hourlyRate").isNumeric().withMessage("Hourly rate must be a number"),
  ],
  clientController.createClient,
);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all clients
 *       401:
 *         description: Not authorized
 */
router.get("/", clientController.getClients);

router.get("/:id", clientController.getClientById);
router.put("/:id", isHR, clientController.updateClient);
router.delete("/:id", isHR, clientController.deleteClient);

module.exports = router;

// const express = require("express");
// const { body } = require("express-validator");
// const {
//   createClient,
//   getClients,
//   getClientById,
//   updateClient,
//   deleteClient,
// } = require("../controllers/clientController");

// const { protect } = require("../middlewares/authMiddleWares");
// const { authorize } = require("../middlewares/roleMiddleWares");

// const router = express.Router();

// All routes below are HR only
// router.use(protect, authorize("HR"));

// router.post(
//   "/",
//   [
//     body("name").notEmpty().withMessage("Client name is required"),
//     body("hourlyRate")
//       .isNumeric()
//       .withMessage("Hourly rate must be a number")
//       .custom((value) => value > 0)
//       .withMessage("Hourly rate must be greater than 0"),
//   ],
//   createClient,
// );

// router.get("/", getClients);
// router.get("/:id", getClientById);
// router.put("/:id", updateClient);
// router.delete("/:id", deleteClient);

// module.exports = router;
