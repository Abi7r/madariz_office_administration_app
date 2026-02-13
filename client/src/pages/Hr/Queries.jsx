import { useState, useEffect } from "react";
import { getQueries, replyToQuery, closeQuery } from "../../services/api";

export default function Queries() {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadQueries();
  }, [filter]);

  const loadQueries = async () => {
    try {
      const params = {};
      if (filter !== "all") {
        params.status = filter;
      }
      const response = await getQueries(params);
      setQueries(response.data);
    } catch (error) {
      console.error("Error loading queries:", error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedQuery || !reply) return;

    try {
      await replyToQuery(selectedQuery._id, { reply });
      setSelectedQuery(null);
      setReply("");
      loadQueries();
      alert("Reply sent successfully!");
    } catch (error) {
      alert("Failed to send reply");
    }
  };

  const handleClose = async (queryId) => {
    if (!confirm("Are you sure you want to close this query?")) return;

    try {
      await closeQuery(queryId);
      loadQueries();
      alert("Query closed successfully! Employee can now resume work.");
    } catch (error) {
      alert("Failed to close query");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "REPLIED":
        return "bg-blue-100 text-blue-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Queries</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("OPEN")}
            className={`px-4 py-2 rounded ${
              filter === "OPEN"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("REPLIED")}
            className={`px-4 py-2 rounded ${
              filter === "REPLIED"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Replied
          </button>
          <button
            onClick={() => setFilter("CLOSED")}
            className={`px-4 py-2 rounded ${
              filter === "CLOSED"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      {/* Queries List */}
      <div className="space-y-4">
        {queries.map((query) => (
          <div key={query._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                      query.priority,
                    )}`}
                  >
                    {query.priority}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      query.status,
                    )}`}
                  >
                    {query.status}
                  </span>
                  <span className="text-xs text-gray-500">{query.type}</span>
                </div>
                <h3 className="font-semibold text-gray-800">
                  Subtask: {query.subtask?.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Raised by: {query.raisedBy?.name} on{" "}
                  {new Date(query.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
              <p className="text-gray-800">{query.message}</p>
            </div>

            {query.reply && (
              <div className="bg-blue-50 rounded p-4 mb-4">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  Reply by {query.repliedBy?.name}:
                </p>
                <p className="text-blue-800">{query.reply}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Date(query.repliedAt).toLocaleString()}
                </p>
              </div>
            )}

            {query.status !== "CLOSED" && (
              <div className="flex gap-2">
                {query.status === "OPEN" && (
                  <button
                    onClick={() => setSelectedQuery(query)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Reply
                  </button>
                )}
                <button
                  onClick={() => handleClose(query._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Close Query
                </button>
              </div>
            )}
          </div>
        ))}

        {queries.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No queries found.
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Reply to Query</h2>
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">Query:</p>
              <p className="text-gray-800">{selectedQuery.message}</p>
            </div>
            <form onSubmit={handleReply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Reply
                </label>
                <textarea
                  required
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Enter your reply..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Send Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuery(null);
                    setReply("");
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
