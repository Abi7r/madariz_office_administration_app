import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (credentials) => api.post("/auth/login", credentials);

// Clients
export const getClients = () => api.get("/clients");
export const createClient = (data) => api.post("/clients", data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Tasks
export const getTasks = (params) => api.get("/tasks", { params });
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post("/tasks", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Subtasks
export const getSubtasks = (params) => api.get("/subtasks", { params });
export const getMySubtasks = () => api.get("/subtasks/my");
export const createSubtask = (data) => api.post("/subtasks", data);
export const updateSubtask = (id, data) => api.put(`/subtasks/${id}`, data);

// Time Logs
export const dismissRejectedLog = (id) => api.post(`/timelogs/${id}/dismiss`);
export const startWork = (data) => api.post("/timelogs/start", data);
export const stopWork = (data) => api.post("/timelogs/stop", data);
export const getActiveTimer = () => api.get("/timelogs/active");
export const getTodayLogs = () => api.get("/timelogs/today");
export const getTimeLogs = (params) => api.get("/timelogs", { params });
export const getPendingLogs = (params) =>
  api.get("/timelogs/pending", { params });
export const approveTimeLog = (id, data) =>
  api.post(`/timelogs/${id}/approve`, data);
export const rejectTimeLog = (id, data) =>
  api.post(`/timelogs/${id}/reject`, data);

// Queries
export const getQueries = (params) => api.get("/queries", { params });
export const raiseQuery = (data) => api.post("/queries", data);
export const replyToQuery = (id, data) =>
  api.post(`/queries/${id}/reply`, data);
export const closeQuery = (id) => api.post(`/queries/${id}/close`);

// Billing
export const getBillings = (params) => api.get("/billings", { params });
export const createBilling = (data) => api.post("/billings", data);
export const getOutstandingBillings = () => api.get("/billings/outstanding");

// Payments
export const getPayments = () => api.get("/payments");
export const createManualPayment = (data) => api.post("/payments/manual", data);
export const createStripePayment = (data) =>
  api.post("/payments/stripe/create", data);

// Ledger
export const getClientLedger = (clientId, params) =>
  api.get(`/ledger/client/${clientId}`, { params });
export const getAllOutstanding = () => api.get("/ledger/outstanding");

// Dashboard
export const getDashboard = () => api.get("/dashboard");

// Users
export const getEmployees = () => api.get("/users/employees");

export default api;
