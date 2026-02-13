import { useState, useEffect } from "react";
import { getDashboard } from "../../services/api";
import { Link } from "react-router-dom";

export default function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
