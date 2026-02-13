const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const clientRoutes = require("./routes/clientRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(
  "/api/payments/webhook/stripe",
  express.raw({ type: "application/json" }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/subtasks", require("./routes/subTaskRoutes"));
app.use("/api/timelogs", require("./routes/timeLogRoutes"));
app.use("/api/queries", require("./routes/queryRoutes"));
app.use("/api/billings", require("./routes/billingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/ledger", require("./routes/ledgerRoutes"));
app.use("/api/dashboard", require("./routes/dashBoardRoutes"));
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
