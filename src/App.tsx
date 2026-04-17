// App.tsx
import { useEffect, useState } from "react";
import {
  Settings,
  BarChart3,
  LayoutDashboard,
  Maximize2,
  Minus,
  X,
  CheckSquare2,
} from "lucide-react";
import TaskBoard from "./TaskBoard";
import Setting from "./Setting";
import "./App.css";
import Statistic from "./Statistic";
import logo from "./assets/devweek_txt_logo.svg";
import { TaskStore } from "./lib/TaskStore";
import { SettingStore, ThemePreference } from "./lib/SettingStore";
import { getCurrentWindow } from "@tauri-apps/api/window";

const settingStore = new SettingStore();
const taskStore = new TaskStore();

const resizeHandles = [
  { className: "top", direction: "North" },
  { className: "right", direction: "East" },
  { className: "bottom", direction: "South" },
  { className: "left", direction: "West" },
  { className: "top-right", direction: "NorthEast" },
  { className: "top-left", direction: "NorthWest" },
  { className: "bottom-right", direction: "SouthEast" },
  { className: "bottom-left", direction: "SouthWest" },
] as const;

type ResizeHandleDirection = (typeof resizeHandles)[number]["direction"];

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [activeView, setActiveView] = useState("board");
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme(),
  );
  const currentWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  const handleTitleBarPointerDown = async (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    try {
      event.preventDefault();

      const [fullscreen, maximized] = await Promise.all([
        currentWindow.isFullscreen(),
        currentWindow.isMaximized(),
      ]);

      if (fullscreen) {
        await currentWindow.setFullscreen(false);
      }

      if (maximized) {
        await currentWindow.unmaximize();
        setIsMaximized(false);
      }

      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      await currentWindow.startDragging();
    } catch {
      // Ignore drag failures; buttons remain usable.
    }
  };

  const handleResizePointerDown = async (
    direction: ResizeHandleDirection,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0 || isMaximized) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      await currentWindow.startResizeDragging(direction);
    } catch {
      // Ignore resize failures gracefully.
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadThemePreference = async () => {
      const savedTheme = await settingStore.getThemePreference();
      if (isMounted) {
        setThemePreference(savedTheme);
      }
    };

    loadThemePreference();

    const runAutoMoveTasks = async () => {
      const changed = await taskStore.moveOverdueOpenTasksToToday(settingStore);
      if (changed) {
        window.dispatchEvent(new Event("tasks:changed"));
      }
    };

    runAutoMoveTasks();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    const syncWindowState = async () => {
      try {
        setIsMaximized(await currentWindow.isMaximized());
      } catch {
        setIsMaximized(false);
      }
    };

    syncWindowState();

    return () => {
      isMounted = false;
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    const resolvedTheme =
      themePreference === "system" ? systemTheme : themePreference;

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [themePreference, systemTheme]);

  const handleThemeChange = async (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme);
    await settingStore.setThemePreference(nextTheme);
  };

  const menuItems = [
    { id: "board", icon: LayoutDashboard, label: "Board" },
    { id: "statistics", icon: BarChart3, label: "Statistics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const viewMeta: Record<string, { title: string; subtitle: string }> = {
    board: {
      title: "Plan Your Week",
      subtitle:
        "Manage tasks in calendar and kanban view, then drag items where they belong.",
    },
    statistics: {
      title: "Progress Insights",
      subtitle:
        "Track completion trends, priorities, and performance over time.",
    },
    settings: {
      title: "Workspace Settings",
      subtitle:
        "Adjust appearance and manage your data safely with native desktop actions.",
    },
  };

  const currentViewMeta = viewMeta[activeView] ?? viewMeta.board;

  return (
    <div className="app-container">
      {!isMaximized &&
        resizeHandles.map(({ className, direction }) => (
          <div
            key={className}
            className={`resize-handle resize-handle--${className}`}
            onPointerDown={(event) => handleResizePointerDown(direction, event)}
            aria-hidden="true"
          />
        ))}

      <header
        className="window-titlebar"
        onPointerDown={handleTitleBarPointerDown}
      >
        <div className="window-titlebar__brand">
          <div className="window-titlebar__logo-badge" aria-hidden="true">
            <CheckSquare2 size={16} />
          </div>
          <img src={logo} alt="DevWeek" className="window-titlebar__logo" />
          <div className="window-titlebar__text">
            <strong>DevWeek</strong>
            <span>Task planner</span>
          </div>
        </div>

        <div
          className="window-titlebar__controls"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="window-control"
            onClick={() => currentWindow.minimize()}
            aria-label="Minimize window"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="window-control"
            onClick={async () => {
              await currentWindow.toggleMaximize();
              const nextMaximized = await currentWindow.isMaximized();
              setIsMaximized(nextMaximized);
            }}
            aria-label={isMaximized ? "Restore window" : "Maximize window"}
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            className="window-control window-control--close"
            onClick={() => currentWindow.close()}
            aria-label="Close window"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <div className="sidebar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`sidebar-btn ${isActive ? "active" : ""}`}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Open ${item.label}`}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="main-content">
          <section className="view-shell">
            <header className="view-shell__header">
              <h1>{currentViewMeta.title}</h1>
              <p>{currentViewMeta.subtitle}</p>
            </header>

            <div className="view-shell__body">
              {activeView === "board" && <TaskBoard />}

              {activeView === "statistics" && <Statistic />}

              {activeView === "settings" && (
                <Setting
                  themePreference={themePreference}
                  systemTheme={systemTheme}
                  onThemeChange={handleThemeChange}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
