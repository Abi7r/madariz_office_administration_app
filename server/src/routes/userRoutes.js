const express = require("express");
const router = express.Router();
const { getEmployees } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleWares");

// GET /api/users/employees
router.get("/employees", protect, getEmployees);

module.exports = router;
