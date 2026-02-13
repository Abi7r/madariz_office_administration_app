// Format duration in minutes
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format datetime
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// Calculate elapsed time
export const calculateElapsed = (startTime) => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const elapsed = Math.floor((now - start) / (1000 * 60)); // minutes
  return elapsed;
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    PENDING: "badge-pending",
    APPROVED: "badge-approved",
    REJECTED: "badge-rejected",
    IN_PROGRESS: "badge-in-progress",
    COMPLETED: "badge-completed",
    ON_HOLD: "badge-on-hold",
    OPEN: "badge-pending",
    REPLIED: "badge-in-progress",
    CLOSED: "badge-completed",
  };
  return colors[status] || "badge-pending";
};

// Get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: "text-green-600",
    MEDIUM: "text-yellow-600",
    HIGH: "text-red-600",
  };
  return colors[priority] || "text-gray-600";
};
