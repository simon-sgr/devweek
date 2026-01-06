import { useState } from "react";
import "./TaskModal.css";
import { TaskData, Priority } from "./types";

/** Turns URLs into clickable <a> links */
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

type Props = {
  task: TaskData;
  onClose: () => void;
  onSave: (task: TaskData) => void;
};

export default function TaskModal({ task, onClose, onSave }: Props) {
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);

  const handleSave = () => {
    onSave({
      ...task,
      description: description || undefined,
      priority,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{task.title}</h2>
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
            <span className="label">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add details, links, notes…"
            />
          </label>

          {description && (
            <div className="description-preview">
              <span className="label">Preview</span>
              <p>{linkify(description)}</p>
            </div>
          )}
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
    </div>
  );
}
