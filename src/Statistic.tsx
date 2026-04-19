import { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  TrendingUp,
  Inbox,
  PauseCircle,
  PieChart as PieChartIcon,
  BarChart3,
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

function startOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(23, 59, 59, 999);
  return result;
}

function parseTaskDate(value: Date | string | undefined): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

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

  function getPeriodBounds() {
    const endDate = endOfDay(now);
    const startDate = new Date(now);

    switch (timePeriod) {
      case "week":
        startDate.setDate(now.getDate() - 6);
        break;
      case "month":
        startDate.setDate(1);
        break;
      case "year":
        startDate.setMonth(0, 1);
        break;
      case "all":
        return null;
    }

    return {
      startDate: startOfDay(startDate),
      endDate,
    };
  }

  // Filter tasks based on selected time period
  const getFilteredTasks = () => {
    if (timePeriod === "all") return tasks;

    const bounds = getPeriodBounds();
    if (!bounds) return tasks;

    return tasks.filter((task) => {
      const taskDate = parseTaskDate(task.date);
      if (!taskDate) return false;
      return taskDate >= bounds.startDate && taskDate <= bounds.endDate;
    });
  };

  const filteredTasks = getFilteredTasks();

  const periodBounds = getPeriodBounds();
  const periodDateRange =
    periodBounds !== null
      ? `${formatShortDate(periodBounds.startDate)} - ${formatShortDate(periodBounds.endDate)}`
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

  const workflowSummary = [
    { name: "Inbox", value: inboxTasks, Icon: Inbox },
    { name: "Ready", value: readyTasks, Icon: CheckCircle },
    { name: "On Hold", value: onHoldTasks, Icon: PauseCircle },
  ];

  // Task status data for pie chart
  const statusData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "Pending", value: pendingTasks, color: "#f59e0b" },
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
      const taskDate = parseTaskDate(task.date);
      if (!taskDate) return false;
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
  const visiblePriorityData = priorityData.filter((p) => p.value > 0);

  return (
    <div className="statistics-container">
      <div className="stats-header">
        <div className="stats-header__title">
          <h2>Statistics</h2>
          <p>
            {periodLabelMap[timePeriod]}: {periodDateRange}
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

      <div className="stats-summary">
        <div className="summary-card summary-card--primary">
          <div className="summary-card__top">
            <span className="summary-card__icon summary-card__icon--primary">
              <Clock size={16} />
            </span>
            <span className="summary-card__label">Current period</span>
          </div>
          <strong>{periodLabelMap[timePeriod]}</strong>
          <span>{periodDateRange}</span>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__icon">
              <CheckCircle size={16} />
            </span>
            <span className="summary-card__label">Tasks</span>
          </div>
          <strong>{totalTasks}</strong>
          <span>{completedTrend}</span>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__icon">
              <TrendingUp size={16} />
            </span>
            <span className="summary-card__label">Completion</span>
          </div>
          <strong>{completionRate}%</strong>
          <span>Finished in the selected period</span>
        </div>

        <div className="summary-card summary-card--compact">
          <div className="summary-card__top">
            <span className="summary-card__icon">
              <Circle size={16} />
            </span>
            <span className="summary-card__label">Open</span>
          </div>
          <strong>{openTasks}</strong>
          <span>Still active</span>
        </div>
      </div>

      <div className="workflow-strip" aria-label="Workflow breakdown">
        {workflowSummary.map((entry) => (
          <div className="workflow-chip" key={entry.name}>
            <div className="workflow-chip__label-wrap">
              <span className="workflow-chip__icon">
                <entry.Icon size={14} />
              </span>
              <span className="workflow-chip__label">{entry.name}</span>
            </div>
            <strong>{entry.value}</strong>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card chart-card--half">
          <div className="chart-card__header">
            <div className="chart-card__title-row">
              <span className="chart-card__icon chart-card__icon--blue">
                <PieChartIcon size={16} />
              </span>
              <h3>Task Status Distribution</h3>
            </div>
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

        <div className="chart-card chart-card--half">
          <div className="chart-card__header">
            <div className="chart-card__title-row">
              <span className="chart-card__icon chart-card__icon--amber">
                <BarChart3 size={16} />
              </span>
              <h3>Priority Distribution</h3>
            </div>
            <p>How much of the workload is urgent versus flexible.</p>
          </div>
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
                <Pie
                  data={visiblePriorityData}
                  cx="50%"
                  cy="46%"
                  labelLine={false}
                  label={false}
                  outerRadius={92}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visiblePriorityData.map((entry, index) => (
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
            <div className="chart-card__title-row">
              <span className="chart-card__icon chart-card__icon--green">
                <BarChart3 size={16} />
              </span>
              <h3>Tasks by Day of Week</h3>
            </div>
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
      </div>
    </div>
  );
}
