import { useState, useEffect } from "react";
import {
  getTasks,
  createTask,
  getClients,
  createSubtask,
  getSubtasks,
  getEmployees,
} from "../../services/api";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [subtasks, setSubtasks] = useState([]); // Add this
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set()); // Add this to track expanded tasks
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    client: "",
  });
  const [subtaskFormData, setSubtaskFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    estimatedHours: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, clientsRes, employeesRes, subtasksRes] =
        await Promise.all([
          getTasks(),
          getClients(),
          getEmployees(),
          getSubtasks(), // Add this
        ]);
      setTasks(tasksRes.data);
      setClients(clientsRes.data);
      setUsers(employeesRes.data);
      setSubtasks(subtasksRes.data); // Add this
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask(taskFormData);
      setShowTaskForm(false);
      setTaskFormData({ title: "", description: "", client: "" });
      loadData();
      alert("Task created successfully!");
    } catch (error) {
      alert("Failed to create task");
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    try {
      await createSubtask({
        ...subtaskFormData,
        task: selectedTask._id,
      });
      setShowSubtaskForm(false);
      setSubtaskFormData({
        title: "",
        description: "",
        assignedTo: "",
        estimatedHours: 0,
      });
      loadData();
      alert("Subtask created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create subtask");
    }
  };

  // Toggle task expansion
  const toggleTask = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Get subtasks for a specific task
  const getTaskSubtasks = (taskId) => {
    return subtasks.filter(
      (subtask) => subtask.task?._id === taskId || subtask.task === taskId,
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "ON_HOLD":
        return "bg-orange-100 text-orange-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tasks & Subtasks</h1>
        <button
          onClick={() => setShowTaskForm(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const taskSubtasks = getTaskSubtasks(task._id);
          const isExpanded = expandedTasks.has(task._id);

          return (
            <div key={task._id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {task.title}
                      </h3>
                      {taskSubtasks.length > 0 && (
                        <button
                          onClick={() => toggleTask(task._id)}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{task.description}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-sm text-gray-600">
                        Client: {task.client?.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        Status: {task.status}
                      </span>
                      <span className="text-sm text-blue-600">
                        Logged: {task.totalLoggedHours || 0}h / Est:{" "}
                        {task.totalEstimatedHours || 0}h
                      </span>
                      <span className="text-sm text-purple-600">
                        📋 {taskSubtasks.length} subtask
                        {taskSubtasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowSubtaskForm(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    + Add Subtask
                  </button>
                </div>

                {/* Subtasks Section */}
                {isExpanded && taskSubtasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Subtasks:
                    </h4>
                    <div className="space-y-2">
                      {taskSubtasks.map((subtask) => (
                        <div
                          key={subtask._id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-800">
                                  {subtask.title}
                                </h5>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                    subtask.status,
                                  )}`}
                                >
                                  {subtask.status}
                                </span>
                              </div>
                              {subtask.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {subtask.description}
                                </p>
                              )}
                              <div className="flex gap-4 text-xs text-gray-500">
                                <span>
                                  👤 {subtask.assignedTo?.name || "Unassigned"}
                                </span>
                                <span>
                                  ⏱️ {subtask.loggedHours || 0}h /{" "}
                                  {subtask.estimatedHours}h
                                </span>
                                {subtask.deadline && (
                                  <span>
                                    📅 Due:{" "}
                                    {new Date(
                                      subtask.deadline,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No tasks yet. Create your first task!
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskFormData.title}
                  onChange={(e) =>
                    setTaskFormData({ ...taskFormData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  required
                  value={taskFormData.client}
                  onChange={(e) =>
                    setTaskFormData({ ...taskFormData, client: e.target.value })
                  }
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
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subtask Modal */}
      {showSubtaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">
              Add Subtask to: {selectedTask?.title}
            </h2>
            <form onSubmit={handleCreateSubtask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtask Title *
                </label>
                <input
                  type="text"
                  required
                  value={subtaskFormData.title}
                  onChange={(e) =>
                    setSubtaskFormData({
                      ...subtaskFormData,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={subtaskFormData.description}
                  onChange={(e) =>
                    setSubtaskFormData({
                      ...subtaskFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To (Employee) *
                </label>
                <select
                  required
                  value={subtaskFormData.assignedTo}
                  onChange={(e) =>
                    setSubtaskFormData({
                      ...subtaskFormData,
                      assignedTo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Employee</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours *
                </label>
                <input
                  type="number"
                  required
                  step="0.5"
                  value={subtaskFormData.estimatedHours}
                  onChange={(e) =>
                    setSubtaskFormData({
                      ...subtaskFormData,
                      estimatedHours: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Subtask
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubtaskForm(false)}
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
