// App.tsx
import { useState } from "react";
import { Settings, BarChart3, LayoutDashboard } from "lucide-react";
import TaskBoard from "./TaskBoard";
import Setting from "./Setting";
import "./App.css";
import Statistic from "./Statistic";
import logo from "./assets/devweek-logo.svg";

function App() {
  const [activeView, setActiveView] = useState("board");

  const menuItems = [
    { id: "board", icon: LayoutDashboard, label: "Board" },
    { id: "statistics", icon: BarChart3, label: "Statistics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
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
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <img
          src={logo}
          alt="DevWeek Logo"
          className="app-logo"
          width={150}
          height={150}
        />

        {activeView === "board" && <TaskBoard />}

        {activeView === "statistics" && <Statistic />}

        {activeView === "settings" && <Setting />}
      </div>
    </div>
  );
}

export default App;
