import { useState, useEffect } from "react";
import {
  getBillings,
  createBilling,
  getTasks,
  getClients,
} from "../../services/api";
import api from "../../services/api";

export default function Billing() {
  const [billings, setBillings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [approvedLogs, setApprovedLogs] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [formData, setFormData] = useState({
    clientId: "",
    taskId: "",
    ratePerHour: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billingsRes, tasksRes, clientsRes] = await Promise.all([
        getBillings(),
        getTasks(),
        getClients(),
      ]);
      setBillings(billingsRes.data);
      setTasks(tasksRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadApprovedLogs = async () => {
    setLoading(true);
    try {
      console.log("Loading approved logs...");

      // Get ALL approved logs with deep population
      const response = await api.get("/timelogs", {
        params: { status: "APPROVED" },
      });

      console.log("All approved logs from API:", response.data);

      // Filter out logs that are already billed
      const unbilledLogs = response.data.filter((log) => {
        if (!log.subtask || !log.subtask.task) {
          console.warn("Log missing subtask or task:", log._id);
          return false;
        }

        const isAlreadyBilled = billings.some((billing) =>
          billing.timeLogs?.some(
            (billedLogId) => billedLogId.toString() === log._id.toString(),
          ),
        );

        return !isAlreadyBilled;
      });

      console.log("Unbilled logs:", unbilledLogs);
      setApprovedLogs(unbilledLogs);
    } catch (error) {
      console.error("Error loading approved logs:", error);
      alert("Failed to load approved logs. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
    setSelectedLogs([]);
    setFormData({
      clientId: "",
      taskId: "",
      ratePerHour: "",
    });
    loadApprovedLogs();
  };

  const handleLogSelection = (logId) => {
    setSelectedLogs((prev) => {
      if (prev.includes(logId)) {
        return prev.filter((id) => id !== logId);
      } else {
        return [...prev, logId];
      }
    });
  };

  const handleSelectAll = (logs) => {
    const logIds = logs.map((log) => log._id);
    setSelectedLogs(logIds);
  };

  const getFilteredLogs = () => {
    let filtered = approvedLogs;

    console.log("Filtering logs. Total approved logs:", filtered.length);
    console.log("Selected clientId:", formData.clientId);
    console.log("Selected taskId:", formData.taskId);

    if (formData.clientId) {
      filtered = filtered.filter((log) => {
        const clientId =
          log.subtask?.task?.client?._id || log.subtask?.task?.client;
        const match = clientId?.toString() === formData.clientId;
        if (!match) {
          console.log(
            "Log filtered out by client:",
            log._id,
            "has client:",
            clientId,
          );
        }
        return match;
      });
      console.log("After client filter:", filtered.length);
    }

    if (formData.taskId) {
      filtered = filtered.filter((log) => {
        const taskId = log.subtask?.task?._id || log.subtask?.task;
        const match = taskId?.toString() === formData.taskId;
        if (!match) {
          console.log(
            "Log filtered out by task:",
            log._id,
            "has task:",
            taskId,
          );
        }
        return match;
      });
      console.log("After task filter:", filtered.length);
    }

    console.log("Final filtered logs:", filtered);
    return filtered;
  };

  const calculateTotal = () => {
    const selectedLogData = approvedLogs.filter((log) =>
      selectedLogs.includes(log._id),
    );

    const totalMinutes = selectedLogData.reduce((sum, log) => {
      const hours =
        log.editedHours !== undefined ? log.editedHours : log.duration / 60;
      return sum + hours * 60;
    }, 0);

    const totalHours = (totalMinutes / 60).toFixed(2);

    let rate = formData.ratePerHour;
    if (!rate && formData.clientId) {
      const client = clients.find((c) => c._id === formData.clientId);
      rate = client?.hourlyRate || 0;
    }

    const amount = (totalHours * (rate || 0)).toFixed(2);

    return { totalHours, amount, rate };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedLogs.length === 0) {
      alert("Please select at least one time log");
      return;
    }

    if (!formData.clientId || !formData.taskId) {
      alert("Please select client and task");
      return;
    }

    try {
      const data = {
        clientId: formData.clientId,
        taskId: formData.taskId,
        timeLogIds: selectedLogs,
      };

      if (formData.ratePerHour) {
        data.ratePerHour = parseFloat(formData.ratePerHour);
      }

      console.log("Creating billing with data:", data);

      await createBilling(data);
      setShowForm(false);
      setFormData({ clientId: "", taskId: "", ratePerHour: "" });
      setSelectedLogs([]);
      loadData();
      alert("Invoice created successfully!");
    } catch (error) {
      console.error("Billing creation error:", error.response || error);
      alert(error.response?.data?.message || "Failed to create billing");
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredLogs = getFilteredLogs();
  const { totalHours, amount, rate } = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Billing</h1>
        <button
          onClick={handleShowForm}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Invoice
        </button>
      </div>

      {/* Billings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Outstanding
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {billings.map((billing) => (
              <tr key={billing._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {billing.invoiceNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {billing.client?.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {billing.task?.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {billing.hours}h @ ₹{billing.ratePerHour}/hr
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ₹{billing.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={
                      billing.outstandingAmount > 0
                        ? "text-red-600 font-medium"
                        : "text-green-600"
                    }
                  >
                    ₹{billing.outstandingAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      billing.isPaid
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {billing.isPaid ? "Paid" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {billings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No invoices yet. Create your first invoice!
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full my-8">
            <h2 className="text-2xl font-semibold mb-6">Create Invoice</h2>

            {loading && (
              <div className="text-center py-4">
                <div className="text-blue-600">Loading approved logs...</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client and Task Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => {
                      console.log("Client changed to:", e.target.value);
                      setFormData({ ...formData, clientId: e.target.value });
                      setSelectedLogs([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task *
                  </label>
                  <select
                    required
                    value={formData.taskId}
                    onChange={(e) => {
                      console.log("Task changed to:", e.target.value);
                      setFormData({ ...formData, taskId: e.target.value });
                      setSelectedLogs([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Task</option>
                    {tasks
                      .filter(
                        (task) =>
                          !formData.clientId ||
                          task.client?._id === formData.clientId,
                      )
                      .map((task) => (
                        <option key={task._id} value={task._id}>
                          {task.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Rate Per Hour (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ratePerHour}
                  onChange={(e) =>
                    setFormData({ ...formData, ratePerHour: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={`Leave empty to use client's default rate${formData.clientId ? ` (₹${clients.find((c) => c._id === formData.clientId)?.hourlyRate || 0}/hr)` : ""}`}
                />
              </div>

              {/* Debug Info */}
              {formData.clientId && formData.taskId && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <strong>Debug Info:</strong>
                  <div>Total approved logs loaded: {approvedLogs.length}</div>
                  <div>
                    Filtered logs for this client/task: {filteredLogs.length}
                  </div>
                </div>
              )}

              {/* Approved Logs Selection */}
              {formData.clientId && formData.taskId && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Select Approved Time Logs ({selectedLogs.length}{" "}
                        selected)
                      </h3>
                      {filteredLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAll(filteredLogs)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All ({filteredLogs.length})
                        </button>
                      )}
                    </div>

                    {filteredLogs.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-800">
                          No approved time logs available for this client and
                          task.
                          <br />
                          Please approve time logs first in the Day-End Review
                          page.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            console.log("Approved logs:", approvedLogs);
                            console.log("Clients:", clients);
                            console.log("Tasks:", tasks);
                            console.log("Selected client:", formData.clientId);
                            console.log("Selected task:", formData.taskId);
                          }}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Click to see debug info in console
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedLogs.length === filteredLogs.length
                                  }
                                  onChange={() => handleSelectAll(filteredLogs)}
                                  className="w-4 h-4"
                                />
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Employee
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Subtask
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Date
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Duration
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Hours
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Remark
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredLogs.map((log) => {
                              const hours =
                                log.editedHours !== undefined
                                  ? log.editedHours
                                  : log.duration / 60;
                              return (
                                <tr
                                  key={log._id}
                                  className={`hover:bg-gray-50 cursor-pointer ${
                                    selectedLogs.includes(log._id)
                                      ? "bg-blue-50"
                                      : ""
                                  }`}
                                  onClick={() => handleLogSelection(log._id)}
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedLogs.includes(log._id)}
                                      onChange={() =>
                                        handleLogSelection(log._id)
                                      }
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {log.employee?.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {log.subtask?.title}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {new Date(log.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {formatDuration(log.duration)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium">
                                    {hours.toFixed(2)}h
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {log.remark || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Invoice Summary */}
                  {selectedLogs.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        Invoice Summary
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-blue-700">Total Hours</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {totalHours}h
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700">Rate per Hour</p>
                          <p className="text-2xl font-bold text-blue-900">
                            ₹{rate || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700">Total Amount</p>
                          <p className="text-2xl font-bold text-blue-900">
                            ₹{amount}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        {selectedLogs.length} time log
                        {selectedLogs.length !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="submit"
                  disabled={selectedLogs.length === 0}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Create Invoice (₹{amount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ clientId: "", taskId: "", ratePerHour: "" });
                    setSelectedLogs([]);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
