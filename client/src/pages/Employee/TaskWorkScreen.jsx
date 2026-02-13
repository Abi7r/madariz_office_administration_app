import { useState, useEffect } from "react";
import {
  getMySubtasks,
  getActiveTimer,
  startWork,
  stopWork,
  getTodayLogs,
  raiseQuery,
  getQueries,
} from "../../services/api";

export default function TaskWorkScreen() {
  const [subtasks, setSubtasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [remark, setRemark] = useState("");
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryData, setQueryData] = useState({
    message: "",
    type: "CLARIFICATION",
    priority: "MEDIUM",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [subtasksRes, timerRes, logsRes] = await Promise.all([
        getMySubtasks(),
        getActiveTimer(),
        getTodayLogs(),
      ]);
      setSubtasks(subtasksRes.data);
      setActiveTimer(timerRes.data);
      setTodayLogs(logsRes.data.logs);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleStartTimer = async (subtaskId) => {
    setLoading(true);
    try {
      await startWork({ subtaskId });
      await loadData();
      alert("Timer started successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to start timer");
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    setLoading(true);
    try {
      await stopWork({ timeLogId: activeTimer._id, remark });
      setRemark("");
      await loadData();
      alert("Timer stopped successfully!");
    } catch (error) {
      alert("Failed to stop timer");
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseQuery = async (e) => {
    e.preventDefault();
    if (!selectedSubtask) return;

    setLoading(true);
    try {
      await raiseQuery({
        subtaskId: selectedSubtask._id,
        ...queryData,
      });
      setShowQueryForm(false);
      setQueryData({ message: "", type: "CLARIFICATION", priority: "MEDIUM" });
      await loadData();
      alert("Query raised successfully! Subtask is now on hold.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to raise query");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">My Work</h1>

      {/* Active Timer Section */}
      {activeTimer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                ⏱️ Timer Running
              </h3>
              <p className="text-green-700 mt-1">
                {activeTimer.subtask?.title}
              </p>
              <p className="text-sm text-green-600 mt-2">
                Started: {new Date(activeTimer.startTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {formatDuration(
                  Math.floor(
                    (Date.now() - new Date(activeTimer.startTime)) / 60000,
                  ),
                )}
              </div>
              <div className="mt-4 space-y-2">
                <textarea
                  placeholder="Add remark (optional)"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded"
                  rows="2"
                />
                <button
                  onClick={handleStopTimer}
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 w-full disabled:opacity-50"
                >
                  Stop Timer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Subtasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Assigned Tasks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {subtasks.map((subtask) => (
            <div key={subtask._id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{subtask.title}</h3>
                  <p className="text-gray-600 mt-1">{subtask.description}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      Task: {subtask.task?.title}
                    </span>
                    <span className="text-gray-600">
                      Client: {subtask.task?.client?.name}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-sm text-gray-600">
                      Estimated: {subtask.estimatedHours}h
                    </span>
                    <span className="text-sm text-blue-600">
                      Logged: {subtask.loggedHours}h
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        subtask.status === "ON_HOLD"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {subtask.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {subtask.status !== "ON_HOLD" && !activeTimer && (
                    <button
                      onClick={() => handleStartTimer(subtask._id)}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Start Work
                    </button>
                  )}
                  {subtask.status === "ON_HOLD" && (
                    <span className="text-orange-600 text-sm font-medium">
                      Query Open - Cannot Work
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSubtask(subtask);
                      setShowQueryForm(true);
                    }}
                    className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
                  >
                    Raise Query
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Today's Work Logs</h2>
        </div>
        <div className="p-6">
          {todayLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No logs yet today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Subtask
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Start Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3 text-sm">
                        {log.subtask?.title || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.startTime).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.duration
                          ? formatDuration(log.duration)
                          : "Running"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : log.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.remark || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Query Form Modal */}
      {showQueryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Raise Query</h3>
            <form onSubmit={handleRaiseQuery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  required
                  value={queryData.message}
                  onChange={(e) =>
                    setQueryData({ ...queryData, message: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows="4"
                  placeholder="Describe your query..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={queryData.type}
                  onChange={(e) =>
                    setQueryData({ ...queryData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="CLARIFICATION">Clarification</option>
                  <option value="BLOCKER">Blocker</option>
                  <option value="APPROVAL_NEEDED">Approval Needed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={queryData.priority}
                  onChange={(e) =>
                    setQueryData({ ...queryData, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Query
                </button>
                <button
                  type="button"
                  onClick={() => setShowQueryForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
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
