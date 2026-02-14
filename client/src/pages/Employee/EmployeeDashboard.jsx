import { useState, useEffect } from "react";
import {
  getDashboard,
  getTimeLogs,
  dismissRejectedLog,
} from "../../services/api";
import { Link } from "react-router-dom";

export default function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [rejectedLogs, setRejectedLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadRejectedLogs();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRejectedLogs = async () => {
    try {
      const response = await getTimeLogs({ status: "REJECTED" });
      // Filter out dismissed logs
      const activeLogs = response.data.filter(
        (log) => !log.dismissedByEmployee,
      );
      setRejectedLogs(activeLogs);
    } catch (error) {
      console.error("Error loading rejected logs:", error);
    }
  };

  const handleDismissLog = async (logId) => {
    try {
      await dismissRejectedLog(logId);
      // Remove from list
      setRejectedLogs(rejectedLogs.filter((log) => log._id !== logId));
    } catch (error) {
      console.error("Error dismissing log:", error);
      alert("Failed to dismiss log");
    }
  };

  const handleDismissAll = async () => {
    if (!confirm(`Dismiss all ${rejectedLogs.length} rejected logs?`)) return;

    try {
      await Promise.all(rejectedLogs.map((log) => dismissRejectedLog(log._id)));
      setRejectedLogs([]);
    } catch (error) {
      console.error("Error dismissing logs:", error);
      alert("Failed to dismiss some logs");
      loadRejectedLogs(); // Reload to show current state
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Today's Hours</div>
          <div className="text-3xl font-bold text-blue-600">
            {dashboard?.todayStats?.totalHours || 0}h
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {dashboard?.todayStats?.logCount || 0} sessions
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Active Timer</div>
          <div className="text-3xl font-bold text-green-600">
            {dashboard?.activeTimer ? "Running" : "Stopped"}
          </div>
          {dashboard?.activeTimer && (
            <div className="text-sm text-gray-500 mt-1">
              {dashboard.activeTimer.elapsed} minutes
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Open Queries</div>
          <div className="text-3xl font-bold text-orange-600">
            {dashboard?.openQueries || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Need attention</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-400">
          <div className="text-sm text-gray-600">Rejected Logs</div>
          <div className="text-3xl font-bold text-red-600">
            {rejectedLogs.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {rejectedLogs.length > 0 ? "Needs review" : "All clear"}
          </div>
        </div>
      </div>

      {/* Active Timer */}
      {dashboard?.activeTimer && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Timer Running</h3>
              <p className="text-sm text-green-700">
                {dashboard.activeTimer.subtask?.title}
              </p>
            </div>
            <Link
              to="/employee/work"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View Work
            </Link>
          </div>
        </div>
      )}

      {/* Rejected Logs Alert */}
      {rejectedLogs.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="font-semibold text-red-800">
                  {rejectedLogs.length} Time{" "}
                  {rejectedLogs.length === 1 ? "Log" : "Logs"} Rejected
                </h3>
              </div>
              <button
                onClick={handleDismissAll}
                className="text-sm text-red-700 hover:text-red-900 font-medium underline"
              >
                Dismiss All
              </button>
            </div>

            <p className="text-sm text-red-700 mb-3">
              Your recent time logs were rejected by HR. Please review the
              reasons below.
            </p>

            <div className="space-y-2">
              {rejectedLogs.slice(0, 3).map((log) => (
                <div
                  key={log._id}
                  className="bg-white rounded p-3 border border-red-200"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {log.subtask?.title || "Subtask"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.date).toLocaleDateString()} •{" "}
                        {(log.editedHours || log.duration / 60).toFixed(2)}h
                      </p>
                      <div className="mt-2 bg-red-50 rounded p-2">
                        <p className="text-xs font-semibold text-red-700">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-red-800">
                          {log.rejectionReason || "No reason provided"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismissLog(log._id)}
                      className="flex-shrink-0 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-100 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {rejectedLogs.length > 3 && (
              <p className="text-sm text-red-600 mt-2">
                + {rejectedLogs.length - 3} more rejected log
                {rejectedLogs.length - 3 === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Assigned Subtasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">My Assigned Tasks</h2>
        </div>
        <div className="p-6">
          {dashboard?.subtasks?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tasks assigned yet
            </p>
          ) : (
            <div className="space-y-4">
              {dashboard?.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {subtask.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {subtask.task} - {subtask.client}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          Estimated: {subtask.estimatedHours}h
                        </span>
                        <span className="text-blue-600">
                          Logged: {subtask.loggedHours}h
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          subtask.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : subtask.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : subtask.status === "ON_HOLD"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subtask.status}
                      </span>
                      {subtask.hasOpenQuery && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Query Open
                        </span>
                      )}
                      <Link
                        to="/employee/work"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Work on this →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
