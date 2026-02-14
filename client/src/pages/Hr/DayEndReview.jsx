import { useState, useEffect } from "react";
import {
  getPendingLogs,
  approveTimeLog,
  rejectTimeLog,
} from "../../services/api";

export default function DayEndReview() {
  const [pendingLogs, setPendingLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editedHours, setEditedHours] = useState("");
  const [editedHoursMap, setEditedHoursMap] = useState({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadPendingLogs();
  }, []);

  const loadPendingLogs = async () => {
    try {
      const response = await getPendingLogs();
      setPendingLogs(response.data);
    } catch (error) {
      console.error("Error loading pending logs:", error);
    }
  };

  const handleApprove = async (logId, hours) => {
    try {
      const data = {};
      if (hours && hours !== "") {
        data.editedHours = parseFloat(hours);
      }

      console.log("Approving log:", logId, "with data:", data); // Debug

      const response = await approveTimeLog(logId, data);
      console.log("Approval response:", response); // Debug

      setEditedHoursMap((prev) => {
        const newMap = { ...prev };
        delete newMap[logId];
        return newMap;
      });

      await loadPendingLogs();
      alert("Time log approved successfully!");
    } catch (error) {
      console.error("Approval error:", error.response || error); // Better debug
      alert(
        `Failed to approve time log: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedLog || !rejectionReason) return;

    try {
      await rejectTimeLog(selectedLog._id, { rejectionReason });
      setShowRejectModal(false);
      setSelectedLog(null);
      setRejectionReason("");
      loadPendingLogs();
      alert("Time log rejected");
    } catch (error) {
      alert("Failed to reject time log");
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Day-End Review</h1>

      {pendingLogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-700">
            All Caught Up!
          </h3>
          <p className="text-gray-500 mt-2">No pending time logs to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingLogs.map((group) => (
            <div
              key={group.employee._id}
              className="bg-white rounded-lg shadow"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {group.employee.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {group.employee.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {group.totalHours.toFixed(2)}h
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.logs.length} logs
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Subtask
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Time
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Duration
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Remark
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {log.subtask?.title}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(log.startTime).toLocaleTimeString()} -{" "}
                          {new Date(log.endTime).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatDuration(log.duration)}
                          <br />
                          <span className="text-xs text-gray-500">
                            ({(log.duration / 60).toFixed(2)}h)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.remark || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Edit hours"
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                value={editedHoursMap[log._id] || ""}
                                onChange={(e) =>
                                  setEditedHoursMap({
                                    ...editedHoursMap,
                                    [log._id]: e.target.value,
                                  })
                                }
                              />
                              <button
                                onClick={() =>
                                  handleApprove(
                                    log._id,
                                    editedHoursMap[log._id],
                                  )
                                }
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              >
                                ✓ Approve
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedLog(log);
                                setShowRejectModal(true);
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Reject Time Log</h2>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Explain why this log is being rejected..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Reject Log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedLog(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
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
