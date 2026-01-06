// TaskModal.tsx
import { useState } from "react";
import "./TaskModal.css";
import { TaskData, Priority } from "./types";

type Props = {
  task: TaskData;
  onClose: () => void;
  onSave: (task: TaskData) => void;
};

const TaskModal = ({ task, onClose, onSave }: Props) => {
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [jiraUrl, setJiraUrl] = useState(task.jiraUrl ?? "");
  const [commitUrl, setCommitUrl] = useState(task.commitUrl ?? "");

  const handleSave = () => {
    onSave({
      ...task,
      description: description || undefined,
      priority,
      jiraUrl: jiraUrl || undefined,
      commitUrl: commitUrl || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task.title}</h2>

        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>

        <label>
          Jira Link
          <input
            type="url"
            value={jiraUrl}
            onChange={(e) => setJiraUrl(e.target.value)}
            placeholder="https://jira..."
          />
        </label>

        <label>
          Commit Link
          <input
            type="url"
            value={commitUrl}
            onChange={(e) => setCommitUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </label>

        <div className="modal__actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
