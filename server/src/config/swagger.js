const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Office Administration API",
      version: "1.0.0",
      description:
        "Complete API documentation for Office Administration System",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication" },
      { name: "Clients", description: "Client management" },
      { name: "Tasks", description: "Task management" },
      { name: "Subtasks", description: "Subtask management" },
      { name: "TimeLogs", description: "Time tracking" },
      { name: "Queries", description: "Query system" },
      { name: "Billing", description: "Billing" },
      { name: "Payments", description: "Payments" },
      { name: "Ledger", description: "Ledger" },
      { name: "Dashboard", description: "Dashboards" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
