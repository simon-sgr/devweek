// Task.tsx
import { useState } from "react";
import "./Task.css";
import { TaskData } from "./types";
import TaskModal from "./TaskModal";

type TaskProps = {
  task: TaskData;
  onToggle: (id: string) => void;
  onUpdate: (task: TaskData) => void;
  onClose?: () => void;
};

const Task = ({ task, onToggle, onUpdate }: TaskProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`task task--${task.priority} ${
          task.completed ? "task--completed" : ""
        }`}
        onClick={() => setOpen(true)}
      >
        <input
          type="checkbox"
          checked={task.completed}
          readOnly
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
        />
        <span className="task__title">{task.title}</span>
      </div>

      {open && (
        <TaskModal
          task={task}
          onClose={() => setOpen(false)}
          onSave={onUpdate}
        />
      )}
    </>
  );
};

export default Task;
