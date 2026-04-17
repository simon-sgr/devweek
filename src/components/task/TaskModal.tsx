import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { open } from "@tauri-apps/plugin-shell";
import "../../styles/TaskInfo.css";
import { TaskData, Priority } from "./types";

type Props = {
  task: TaskData;
  onClose: () => void;
  onSave: (task: TaskData) => void;
};

export default function TaskModal({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setIsPreview(false);
  }, [task]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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

  const handleSave = () => {
    onSave({
      ...task,
      title: title.trim() || task.title,
      description: description || undefined,
      priority,
    });
    onClose();
  };

  return createPortal(
    <div className="modal-backdrop" onClick={handleSave} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit task"
      >
        <header className="modal-header">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Task title"
          />
        </header>

        <div className="modal-body">
          <label>
            <span className="label">Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
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
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={handleSave} className="btn primary">
            Save
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
