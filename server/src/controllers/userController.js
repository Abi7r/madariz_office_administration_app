const User = require("../models/user");

// Get all active employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "EMPLOYEE",
      isActive: true,
    })
      .select("_id name email")
      .sort({ name: 1 });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
