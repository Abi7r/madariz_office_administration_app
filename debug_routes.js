try {
  const timeLogRoutes = require("./server/src/routes/timeLogRoutes");
  console.log("Successfully loaded timeLogRoutes");
} catch (error) {
  console.error("Error loading timeLogRoutes:", error);
}
