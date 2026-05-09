// Task.tsx
import { useState } from "react";
import "./Task.css";
import { TaskData } from "./types";
import TaskModal from "./TaskModal";

interface TaskProps {
  task: TaskData;
  onToggle: (id: string) => void;
  onUpdate: (task: TaskData) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const Task = ({
  task,
  onToggle,
  onUpdate,
  onDelete,
  dragHandleProps,
}: TaskProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`task task--${task.priority} ${
          task.completed ? "task--completed" : ""
        }`}
        {...dragHandleProps}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div
          className="drag-handle"
          aria-hidden="true"
          onClick={(e) => e.stopPropagation()}
        >
          <span />
          <span />
          <span />
        </div>

        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
        <span className="task__title">{task.title}</span>
      </div>

      {open && (
        <TaskModal
          task={task}
          onClose={() => setOpen(false)}
          onSave={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default Task;
