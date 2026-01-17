import { useState, useRef } from "react";
import { Download, Upload, FileJson, Trash2 } from "lucide-react";
import { TaskStore } from "./lib/TaskStore";
import "./Setting.css";

export default function Settings() {
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskStore = new TaskStore();

  const handleExport = async () => {
    try {
      const jsonData = await taskStore.exportTasks();

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await taskStore.importTasks(text);

      setImportStatus(
        "Tasks imported successfully! Refresh the page to see changes.",
      );
      setTimeout(() => setImportStatus(""), 5000);
    } catch (error) {
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
      setDeleteStatus(
        "All tasks deleted successfully! Refresh the page to see changes.",
      );
      setShowDeleteConfirm(false);
      setTimeout(() => setDeleteStatus(""), 5000);
    } catch (error) {
      setDeleteStatus("Failed to delete tasks.");
      setShowDeleteConfirm(false);
      setTimeout(() => setDeleteStatus(""), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="view-container">
      <h2>Settings</h2>

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
