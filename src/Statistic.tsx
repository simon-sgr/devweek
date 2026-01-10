import { useState, useEffect } from "react";
import { CheckCircle, Circle, Clock, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TaskStore } from "./lib/TaskStore";
import "./Statistic.css";
import { TaskData } from "./components/task/types";

const taskStore = new TaskStore();

export default function Statistic() {
  const [tasks, setTasks] = useState<TaskData[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const loadedTasks = await taskStore.loadTasks();
    setTasks(loadedTasks);
  };

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task status data for pie chart
  const statusData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "Pending", value: pendingTasks, color: "#f59e0b" },
  ];

  // Tasks by day of week
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const tasksByDay = dayNames.map((day) => {
    const count = tasks.filter((task) => {
      if (!task.date) return false;
      const taskDate = new Date(task.date);
      const taskDayIndex = taskDate.getDay();
      return (
        taskDayIndex >= 0 && taskDayIndex < 7 && dayNames[taskDayIndex] === day
      );
    }).length;
    return { day, count };
  });

  // Priority distribution
  const priorityData = [
    {
      name: "High",
      value: tasks.filter((t) => t.priority === "high").length,
      color: "#ef4444",
    },
    {
      name: "Medium",
      value: tasks.filter((t) => t.priority === "medium").length,
      color: "#f59e0b",
    },
    {
      name: "Low",
      value: tasks.filter((t) => t.priority === "low").length,
      color: "#10b981",
    },
  ];

  return (
    <div className="statistics-container">
      <h2>Statistics</h2>

      {/* Overview Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p className="stat-number">{totalTasks}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-number">{completedTasks}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Circle size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p className="stat-number">{pendingTasks}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rate">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Completion Rate</h3>
            <p className="stat-number">{completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Completion Rate Pie Chart */}
        <div className="chart-card">
          <h3>Task Status Distribution</h3>
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 1) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No tasks yet</p>
          )}
        </div>

        {/* Tasks by Day Bar Chart */}
        <div className="chart-card">
          <h3>Tasks by Day of Week</h3>
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByDay}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No tasks yet</p>
          )}
        </div>

        {/* Priority Distribution Pie Chart */}
        <div className="chart-card">
          <h3>Priority Distribution</h3>
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData.filter((p) => p.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
