import { useEffect, useState, useRef } from "react";
import {
  Download,
  Upload,
  FileJson,
  Trash2,
  Monitor,
  Moon,
  SunMedium,
} from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { TaskStore } from "./lib/TaskStore";
import { SettingStore, ThemePreference } from "./lib/SettingStore";
import "./Setting.css";

type SettingsProps = {
  themePreference: ThemePreference;
  systemTheme: "light" | "dark";
  onThemeChange: (theme: ThemePreference) => Promise<void>;
};

export default function Settings({
  themePreference,
  systemTheme,
  onThemeChange,
}: SettingsProps) {
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [autoMoveTasks, setAutoMoveTasks] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskStore = new TaskStore();
  const settingStore = new SettingStore();
  const isTauriRuntime =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  const notifyTasksChanged = () => {
    window.dispatchEvent(new Event("tasks:changed"));
  };

  useEffect(() => {
    const loadAutoMoveTasks = async () => {
      const enabled = await settingStore.getAutoMoveTasks();
      setAutoMoveTasks(enabled);
    };

    loadAutoMoveTasks();
  }, []);

  const handleAutoMoveTasksChange = async (enabled: boolean) => {
    setAutoMoveTasks(enabled);
    await settingStore.setAutoMoveTasks(enabled);

    if (enabled) {
      const changed = await taskStore.moveOverdueOpenTasksToToday(settingStore);
      if (changed) {
        notifyTasksChanged();
      }
    }
  };

  const handleExport = async () => {
    try {
      const jsonData = await taskStore.exportTasks();

      if (isTauriRuntime) {
        const outputPath = await save({
          defaultPath: `devweek-tasks-${new Date().toISOString().split("T")[0]}.json`,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });

        if (!outputPath) {
          return;
        }

        await writeTextFile(outputPath, jsonData);
        setExportStatus("Tasks exported successfully!");
        setTimeout(() => setExportStatus(""), 3000);
        return;
      }

      // Check if File System Access API is supported
      if ("showSaveFilePicker" in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `devweek-tasks-${
            new Date().toISOString().split("T")[0]
          }.json`,
          types: [
            {
              description: "JSON Files",
              accept: { "application/json": [".json"] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(jsonData);
        await writable.close();

        setExportStatus("Tasks exported successfully!");
      } else {
        // Fallback for browsers that don't support File System Access API
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `devweek-tasks-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportStatus("Tasks exported successfully!");
      }

      setTimeout(() => setExportStatus(""), 3000);
    } catch (error) {
      // User cancelled or error occurred
      if ((error as any).name !== "AbortError") {
        setExportStatus("Failed to export tasks.");
        setTimeout(() => setExportStatus(""), 3000);
      }
    }
  };

  const handleImportClick = async () => {
    if (isTauriRuntime) {
      try {
        const selectedPath = await open({
          multiple: false,
          directory: false,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });

        if (!selectedPath || Array.isArray(selectedPath)) {
          return;
        }

        const text = await readTextFile(selectedPath);
        await taskStore.importTasks(text);
        notifyTasksChanged();
        setImportStatus("Tasks imported successfully!");
        setTimeout(() => setImportStatus(""), 3000);
      } catch {
        setImportStatus(
          "Failed to import tasks. Please check the file format.",
        );
        setTimeout(() => setImportStatus(""), 3000);
      }

      return;
    }

    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await taskStore.importTasks(text);
      notifyTasksChanged();

      setImportStatus("Tasks imported successfully!");
      setTimeout(() => setImportStatus(""), 3000);
    } catch {
      setImportStatus("Failed to import tasks. Please check the file format.");
      setTimeout(() => setImportStatus(""), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await taskStore.saveTasks([]);
      notifyTasksChanged();
      setDeleteStatus("All tasks deleted successfully!");
      setShowDeleteConfirm(false);
      setTimeout(() => setDeleteStatus(""), 3000);
    } catch {
      setDeleteStatus("Failed to delete tasks.");
      setShowDeleteConfirm(false);
      setTimeout(() => setDeleteStatus(""), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const themeLabel =
    themePreference === "system"
      ? `Using OS setting (${systemTheme === "dark" ? "Dark" : "Light"})`
      : `${themePreference === "dark" ? "Dark" : "Light"} mode`;

  return (
    <div className="view-container">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Appearance</h3>
        <p className="settings-description">
          Choose a light theme, dark theme, or follow your operating system.
        </p>

        <div className="theme-picker">
          <label
            className={`theme-option ${themePreference === "light" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="theme-preference"
              value="light"
              checked={themePreference === "light"}
              onChange={() => onThemeChange("light")}
            />
            <SunMedium size={16} />
            <span>Light</span>
          </label>

          <label
            className={`theme-option ${themePreference === "dark" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="theme-preference"
              value="dark"
              checked={themePreference === "dark"}
              onChange={() => onThemeChange("dark")}
            />
            <Moon size={16} />
            <span>Dark</span>
          </label>

          <label
            className={`theme-option ${themePreference === "system" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="theme-preference"
              value="system"
              checked={themePreference === "system"}
              onChange={() => onThemeChange("system")}
            />
            <Monitor size={16} />
            <span>System</span>
          </label>
        </div>

        <p className="settings-theme-summary">{themeLabel}</p>
      </div>

      <div className="settings-section">
        <h3>Task Automation</h3>
        <p className="settings-description">
          Move open overdue tasks to today once per day when the app opens.
          Completed tasks stay where they are.
        </p>

        <label className="automation-toggle">
          <input
            type="checkbox"
            checked={autoMoveTasks}
            onChange={(event) =>
              handleAutoMoveTasksChange(event.target.checked)
            }
          />
          <span className="automation-toggle__text">
            <strong>Auto-move overdue open tasks</strong>
            <span>
              Enabled tasks with a past date will be moved to today only once
              per day.
            </span>
          </span>
        </label>
      </div>

      <div className="settings-section">
        <h3>Data Management</h3>
        <p className="settings-description">
          Export your tasks as a JSON file or import tasks from a previously
          exported file.
        </p>

        <div className="settings-actions">
          <button className="settings-btn export-btn" onClick={handleExport}>
            <Download size={20} />
            <span>Export Tasks</span>
          </button>

          <button
            className="settings-btn import-btn"
            onClick={handleImportClick}
          >
            <Upload size={20} />
            <span>Import Tasks</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </div>

        {exportStatus && (
          <div
            className={`settings-status ${
              exportStatus.includes("Failed") ? "error" : "success"
            }`}
          >
            <FileJson size={16} />
            {exportStatus}
          </div>
        )}

        {importStatus && (
          <div
            className={`settings-status ${
              importStatus.includes("Failed") ? "error" : "success"
            }`}
          >
            <FileJson size={16} />
            {importStatus}
          </div>
        )}
      </div>

      <div className="settings-section danger-zone">
        <h3>Danger Zone</h3>
        <p className="settings-description">
          Permanently delete all tasks. This action cannot be undone.
        </p>

        <button className="settings-btn delete-btn" onClick={handleDeleteClick}>
          <Trash2 size={20} />
          <span>Delete All Tasks</span>
        </button>

        {deleteStatus && (
          <div
            className={`settings-status ${
              deleteStatus.includes("Failed") ? "error" : "success"
            }`}
          >
            <FileJson size={16} />
            {deleteStatus}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <h3>Delete All Tasks</h3>
            <p>
              Are you sure you want to delete all tasks? This action cannot be
              undone.
            </p>
            <p className="delete-warning">
              <strong>Warning:</strong> All your tasks will be permanently
              removed.
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleDeleteConfirm}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
