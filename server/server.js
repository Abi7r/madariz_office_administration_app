require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const cron = require("node-cron");
const {
  checkOutstandingSubtasks,
} = require("./src/services/outstandingService");

const PORT = process.env.PORT || 5000;

connectDB();

cron.schedule("0 * * * *", async () => {
  console.log("Checking outstanding subtasks...");
  await checkOutstandingSubtasks();
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
