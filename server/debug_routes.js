try {
  console.log("Starting debug script...");
  const auth = require("./src/middlewares/authMiddleWares");
  console.log("Loaded authMiddleWares:", auth);
  console.log("Protect is:", typeof auth.protect);
  console.log("isHR is:", typeof auth.isHR);

  const timeLogRoutes = require("./src/routes/timeLogRoutes");
  console.log("Successfully loaded timeLogRoutes");
} catch (error) {
  console.error("Error loading timeLogRoutes:", error);
}
console.log("Script finished.");
