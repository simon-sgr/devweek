import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { open } from "@tauri-apps/plugin-shell";
import type { TaskData, TaskStatus } from "./types";
import "../../styles/TaskInfo.css";

interface AddTaskFormProps {
  onAddTask: (task: TaskData) => void;
  onCancel?: () => void;
  date?: Date;
  status?: TaskStatus;
}

const defaultPriority = "low";

export default function AddTaskForm({
  onAddTask,
  onCancel,
  date,
  status,
}: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(defaultPriority);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (onCancel) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onCancel();
        }
      };

      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }

    return undefined;
  }, [onCancel]);

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A") {
      e.preventDefault();
      const href = target.getAttribute("href");
      if (href) {
        open(href);
      }
    }
  };

  function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const newTask: TaskData = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      completed: false,
      priority: priority as TaskData["priority"],
      date: date,
      status: status,
    };

    onAddTask(newTask);

    setTitle("");
    setDescription("");
    setPriority(defaultPriority);
    setIsPreview(false);
    setError("");
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add task"
      >
        <header className="modal-header">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            className="title-input"
            placeholder="Task title"
          />
          {error && <div className="error-message">{error}</div>}
        </header>

        <div className="modal-body">
          <label>
            <span className="label">Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`priority-select ${priority}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            <div className="description-header">
              <span className="label">Description</span>
              {description && (
                <button
                  type="button"
                  onClick={() => setIsPreview(!isPreview)}
                  className="preview-toggle"
                  title={isPreview ? "Edit" : "Preview"}
                >
                  {isPreview ? "Edit" : "Preview"}
                </button>
              )}
            </div>
            {isPreview ? (
              <div className="description-preview" onClick={handleLinkClick}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {description}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Add details, links, notes... (supports markdown: **bold**, *italic*, [links](url), # headers, etc.)"
              />
            )}
          </label>
        </div>

        <footer className="modal-actions">
          {onCancel && (
            <button onClick={onCancel} className="btn">
              Cancel
            </button>
          )}
          <button onClick={handleSubmit} className="btn primary">
            Add Task
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
