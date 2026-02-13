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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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
      const [tasksRes, clientsRes, employeesRes] = await Promise.all([
        getTasks(),
        getClients(),
        getEmployees(),
      ]);
      setTasks(tasksRes.data);
      setClients(clientsRes.data);
      setUsers(employeesRes.data);
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
        {tasks.map((task) => (
          <div key={task._id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {task.title}
                  </h3>
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
            </div>
          </div>
        ))}
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
                  Assign To (Employee ID) *
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
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Login as employee and check user ID from dashboard
                </p>
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
