import { useState, FormEvent } from "react";
import type { TaskData, TaskStatus } from "./types";
import "./AddTaskForm.css";

interface AddTaskFormProps {
  onAddTask: (task: TaskData) => void;
  onCancel?: () => void;
  date?: string; // optional date to pre-fill the task date
  status?: TaskStatus; // optional status to pre-fill the task status
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");

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
  }

  return (
    <Modal onClose={onCancel}>
      <form
        className="add-task-form"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Add New Task</h3>
        <label className="form-label">
          Title*:
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Task title"
          />
        </label>

        <label className="form-label">
          Description:
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Optional detailed description"
          />
        </label>

        <label className="form-label">
          Priority:
          <select
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <div className="form-buttons">
          {onCancel && (
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-submit">
            Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      {children}
    </div>
  );
}
