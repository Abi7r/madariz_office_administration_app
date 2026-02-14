import { useState, useEffect } from "react";
import { getQueries } from "../../services/api";

export default function EmployeeQueries() {
  const [queries, setQueries] = useState([]);
  const [filter, setFilter] = useState("all"); // all, open, replied, closed
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      // Get only current user's queries
      const response = await getQueries();
      setQueries(response.data);
    } catch (error) {
      console.error("Error loading queries:", error);
    }
  };

  const getFilteredQueries = () => {
    switch (filter) {
      case "open":
        return queries.filter((q) => q.status === "OPEN");
      case "replied":
        // Show all queries that have received a reply (regardless of CLOSED status)
        return queries.filter((q) => q.reply && q.reply.trim() !== "");
      case "closed":
        return queries.filter((q) => q.status === "CLOSED");
      default:
        return queries;
    }
  };

  const handleViewQuery = (query) => {
    setSelectedQuery(query);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-100 text-yellow-800";
      case "REPLIED":
        return "bg-blue-100 text-blue-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      case "LOW":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredQueries = getFilteredQueries();

  // Count queries by status and reply
  const openCount = queries.filter((q) => q.status === "OPEN").length;
  const repliedCount = queries.filter(
    (q) => q.reply && q.reply.trim() !== "",
  ).length; // Count all with replies
  const closedCount = queries.filter((q) => q.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">My Queries</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600">Total Queries</p>
          <p className="text-2xl font-bold text-gray-800">{queries.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-600">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{openCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
          <p className="text-sm text-gray-600">With Replies</p>
          <p className="text-2xl font-bold text-blue-600">{repliedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
          <p className="text-sm text-gray-600">Closed</p>
          <p className="text-2xl font-bold text-green-600">{closedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({queries.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 rounded transition ${
              filter === "open"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setFilter("replied")}
            className={`px-4 py-2 rounded transition ${
              filter === "replied"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            With Replies ({repliedCount})
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-4 py-2 rounded transition ${
              filter === "closed"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Closed ({closedCount})
          </button>
        </div>
      </div>

      {/* Queries List */}
      <div className="bg-white rounded-lg shadow">
        {filteredQueries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700">
              No Queries Found
            </h3>
            <p className="text-gray-500 mt-2">
              {filter === "all"
                ? "You haven't raised any queries yet."
                : filter === "replied"
                  ? "No queries with replies yet."
                  : `No ${filter.toLowerCase()} queries.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredQueries.map((query) => (
              <div
                key={query._id}
                className="p-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleViewQuery(query)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          query.status,
                        )}`}
                      >
                        {query.status}
                      </span>
                      <span
                        className={`text-xs font-semibold ${getPriorityColor(query.priority)}`}
                      >
                        {query.priority} PRIORITY
                      </span>
                      <span className="text-xs text-gray-500">
                        {query.type}
                      </span>
                    </div>

                    <h3 className="font-medium text-gray-800 mb-1">
                      {query.subtask?.title || "Subtask"}
                    </h3>

                    <p className="text-sm text-gray-600 mb-2">
                      {query.message.length > 100
                        ? `${query.message.substring(0, 100)}...`
                        : query.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Raised: {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                      {/* Show reply indicator if query has a reply */}
                      {query.reply && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          HR replied
                        </span>
                      )}
                      {query.status === "CLOSED" && query.closedAt && (
                        <span>
                          Closed:{" "}
                          {new Date(query.closedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Query Detail Modal */}
      {showModal && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Query Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedQuery.subtask?.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedQuery(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Status & Priority */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                  selectedQuery.status,
                )}`}
              >
                {selectedQuery.status}
              </span>
              <span
                className={`text-sm font-semibold ${getPriorityColor(selectedQuery.priority)}`}
              >
                {selectedQuery.priority} PRIORITY
              </span>
              <span className="text-sm text-gray-600">
                {selectedQuery.type}
              </span>
            </div>

            {/* Original Query */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  ME
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">You</span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedQuery.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{selectedQuery.message}</p>
                </div>
              </div>
            </div>

            {/* Reply Section - Check if reply exists */}
            {selectedQuery.reply ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  HR Reply
                </h3>
                <div className="bg-green-50 border-l-4 border-green-500 rounded p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                      HR
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {selectedQuery.repliedBy?.name || "HR"}
                        </span>
                        {selectedQuery.repliedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(selectedQuery.repliedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{selectedQuery.reply}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
                <p className="text-yellow-800 text-sm">
                  ⏳ Waiting for HR response...
                </p>
              </div>
            )}

            {/* Closed Info */}
            {selectedQuery.status === "CLOSED" && selectedQuery.closedAt && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-600">
                  ✅ This query was closed on{" "}
                  <span className="font-semibold">
                    {new Date(selectedQuery.closedAt).toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You can now continue working on this task.
                </p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedQuery(null);
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
