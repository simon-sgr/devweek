import { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  TrendingUp,
  Inbox,
  PauseCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TaskStore } from "./lib/TaskStore";
import "./Statistic.css";
import { TaskData } from "./components/task/types";

const taskStore = new TaskStore();

type TimePeriod = "week" | "month" | "year" | "all";

export default function Statistic() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");

  useEffect(() => {
    loadTasks();

    const handleTasksChanged = () => {
      loadTasks();
    };

    window.addEventListener("tasks:changed", handleTasksChanged);
    return () => {
      window.removeEventListener("tasks:changed", handleTasksChanged);
    };
  }, []);

  const loadTasks = async () => {
    const loadedTasks = await taskStore.loadTasks();
    setTasks(loadedTasks);
  };

  // Filter tasks based on selected time period
  const getFilteredTasks = () => {
    if (timePeriod === "all") return tasks;

    const now = new Date();
    const startDate = new Date();

    switch (timePeriod) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return tasks.filter((task) => {
      if (!task.date) return false;
      const taskDate = new Date(task.date);
      return taskDate >= startDate && taskDate <= now;
    });
  };

  const filteredTasks = getFilteredTasks();

  const now = new Date();
  const periodLabelMap: Record<TimePeriod, string> = {
    week: "This week",
    month: "This month",
    year: "This year",
    all: "All time",
  };

  const formatShortDate = (value: Date) =>
    value.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const getPeriodStartDate = () => {
    const startDate = new Date(now);

    switch (timePeriod) {
      case "week":
        startDate.setDate(now.getDate() - 6);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        return null;
    }

    startDate.setHours(0, 0, 0, 0);
    return startDate;
  };

  const periodStartDate = getPeriodStartDate();
  const periodDateRange =
    periodStartDate !== null
      ? `${formatShortDate(periodStartDate)} - ${formatShortDate(now)}`
      : `All tasks in your workspace`;

  // Calculate statistics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.completed).length;
  const pendingTasks = filteredTasks.filter((t) => !t.completed).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const inboxTasks = tasks.filter((t) => t.status === "inbox").length;
  const readyTasks = tasks.filter((t) => t.status === "ready").length;
  const onHoldTasks = tasks.filter((t) => t.status === "on-hold").length;
  const openTasks = filteredTasks.filter((t) => !t.completed).length;

  const completedTrend =
    totalTasks > 0
      ? `${completedTasks} completed, ${pendingTasks} still open`
      : "No tasks in this period yet";

  // Task status data for pie chart
  const statusData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "Pending", value: pendingTasks, color: "#f59e0b" },
  ];

  const workflowStatusData = [
    { name: "Inbox", value: inboxTasks, color: "#60a5fa" },
    { name: "Ready", value: readyTasks, color: "#10b981" },
    { name: "On Hold", value: onHoldTasks, color: "#f59e0b" },
  ];

  // Tasks by day of week
  const weekdaySeries = [
    { label: "Mon", index: 1 },
    { label: "Tue", index: 2 },
    { label: "Wed", index: 3 },
    { label: "Thu", index: 4 },
    { label: "Fri", index: 5 },
  ];
  const tasksByDay = weekdaySeries.map(({ label, index }) => {
    const count = filteredTasks.filter((task) => {
      if (!task.date) return false;
      const taskDate = new Date(task.date);
      return taskDate.getDay() === index;
    }).length;
    return { day: label, count };
  });

  // Priority distribution
  const priorityData = [
    {
      name: "High",
      value: filteredTasks.filter((t) => t.priority === "high").length,
      color: "#ef4444",
    },
    {
      name: "Medium",
      value: filteredTasks.filter((t) => t.priority === "medium").length,
      color: "#f59e0b",
    },
    {
      name: "Low",
      value: filteredTasks.filter((t) => t.priority === "low").length,
      color: "#10b981",
    },
  ];

  return (
    <div className="statistics-container">
      <div className="stats-header">
        <div className="stats-header__title">
          <h2>Statistics</h2>
          <p>
            {periodLabelMap[timePeriod]} · {periodDateRange}
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="time-period-selector">
          <button
            className={timePeriod === "week" ? "active" : ""}
            onClick={() => setTimePeriod("week")}
          >
            This Week
          </button>
          <button
            className={timePeriod === "month" ? "active" : ""}
            onClick={() => setTimePeriod("month")}
          >
            This Month
          </button>
          <button
            className={timePeriod === "year" ? "active" : ""}
            onClick={() => setTimePeriod("year")}
          >
            This Year
          </button>
          <button
            className={timePeriod === "all" ? "active" : ""}
            onClick={() => setTimePeriod("all")}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="stats-highlights">
        <div className="highlight-card highlight-card--primary">
          <span className="highlight-card__label">Current period</span>
          <strong>{periodLabelMap[timePeriod]}</strong>
          <span>{periodDateRange}</span>
        </div>

        <div className="highlight-card">
          <span className="highlight-card__label">Open tasks</span>
          <strong>{openTasks}</strong>
          <span>{completedTrend}</span>
        </div>

        <div className="highlight-card">
          <span className="highlight-card__label">Completion rate</span>
          <strong>{completionRate}%</strong>
          <span>Of tasks in the selected period</span>
        </div>
      </div>

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

        <div className="stat-card">
          <div className="stat-icon inbox">
            <Inbox size={24} />
          </div>
          <div className="stat-info">
            <h3>Inbox</h3>
            <p className="stat-number">{inboxTasks}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon ready">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Ready</h3>
            <p className="stat-number">{readyTasks}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon hold">
            <PauseCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>On Hold</h3>
            <p className="stat-number">{onHoldTasks}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Completion Rate Pie Chart */}
        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Task Status Distribution</h3>
            <p>Completed versus open tasks in the selected period.</p>
          </div>
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="46%"
                  labelLine={false}
                  label={false}
                  outerRadius={92}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(
                    value: number | string | undefined,
                    name: string | undefined,
                  ) => [value ?? 0, name ?? ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="pie-legend-label">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No tasks found for this time period</p>
          )}
        </div>

        {/* Tasks by Day Bar Chart */}
        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Tasks by Day of Week</h3>
            <p>Where work is concentrated across the workweek.</p>
          </div>
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
            <p className="no-data">No tasks found for this time period</p>
          )}
        </div>

        {/* Priority Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Priority Distribution</h3>
            <p>How much of the workload is urgent versus flexible.</p>
          </div>
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
                <Pie
                  data={priorityData.filter((p) => p.value > 0)}
                  cx="50%"
                  cy="46%"
                  labelLine={false}
                  label={false}
                  outerRadius={92}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(
                    value: number | string | undefined,
                    name: string | undefined,
                  ) => [value ?? 0, name ?? ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="pie-legend-label">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No tasks found for this time period</p>
          )}
        </div>

        <div className="chart-card chart-card--wide">
          <div className="chart-card__header">
            <h3>Workflow Status</h3>
            <p>Inbox, ready, and on hold counts for the selected period.</p>
          </div>
          {totalTasks > 0 ? (
            <div className="workflow-status-grid">
              {workflowStatusData.map((entry) => (
                <div className="workflow-status-item" key={entry.name}>
                  <span
                    className="workflow-status-item__dot"
                    style={{ background: entry.color }}
                  />
                  <div>
                    <strong>{entry.name}</strong>
                    <span>{entry.value} tasks</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No tasks found for this time period</p>
          )}
        </div>
      </div>
    </div>
  );
}
