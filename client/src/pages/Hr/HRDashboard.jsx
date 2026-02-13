import { useState, useEffect } from "react";
import { getDashboard } from "../../services/api";
import { Link } from "react-router-dom";

export default function HRDashboard() {
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
      <h1 className="text-3xl font-bold text-gray-800">HR Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-3xl font-bold text-orange-600">
            {dashboard?.pendingApprovals || 0}
          </div>
          <Link
            to="/hr/review"
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            Review now →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Open Queries</div>
          <div className="text-3xl font-bold text-red-600">
            {dashboard?.openQueries || 0}
          </div>
          <Link
            to="/hr/queries"
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            View queries →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Today's Hours</div>
          <div className="text-3xl font-bold text-green-600">
            {dashboard?.todayStats?.totalHours || 0}h
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {dashboard?.todayStats?.logCount || 0} logs
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Outstanding</div>
          <div className="text-3xl font-bold text-purple-600">
            ₹{dashboard?.outstanding || 0}
          </div>
          <Link
            to="/hr/ledger"
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            View ledger →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/hr/clients"
            className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium">Manage Clients</div>
          </Link>
          <Link
            to="/hr/tasks"
            className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Create Task</div>
          </Link>
          <Link
            to="/hr/review"
            className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition text-center"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium">Review Logs</div>
          </Link>
          <Link
            to="/hr/billing"
            className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">Create Invoice</div>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {dashboard?.pendingApprovals > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-800">
                You have <strong>{dashboard.pendingApprovals}</strong> time logs
                waiting for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {dashboard?.openQueries > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>{dashboard.openQueries}</strong> queries need your
                attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
