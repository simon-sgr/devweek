import { TaskData } from "../task/types";
import Task from "../task/Task";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import "./Kanban.css";
import { useState } from "react";
import AddTaskForm from "../task/AddTaskForm";
import { Plus } from "lucide-react";

interface KanbanProps {
  tasks: TaskData[];
  onUpdateTask: (task: TaskData) => void;
  onToggle: (id: string) => void;
  onAddTask: (task: TaskData) => void;
}

const columns: { id: string; label: string }[] = [
  { id: "status:inbox", label: "Inbox" },
  { id: "status:ready", label: "Ready" },
  { id: "status:on-hold", label: "On Hold" },
];

export default function Kanban({
  tasks,
  onUpdateTask,
  onToggle,
  onAddTask,
}: KanbanProps) {
  // Group tasks by status
  const tasksByStatus = columns.reduce<Record<string, TaskData[]>>(
    (acc, col) => {
      acc[col.id] = tasks.filter((task) => {
        // For kanban tasks, date must be undefined, status must match column id (after removing prefix)
        if (task.date) return false;
        return task.status === col.id.replace("status:", "");
      });
      return acc;
    },
    {}
  );

  return (
    <div className="kanban">
      {columns.map(({ id, label }) => (
        <KanbanColumn
          key={id}
          id={id}
          label={label}
          tasks={tasksByStatus[id]}
          onUpdateTask={onUpdateTask}
          onToggle={onToggle}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}

interface KanbanColumnProps {
  id: string;
  label: string;
  tasks: TaskData[];
  onUpdateTask: (task: TaskData) => void;
  onToggle: (id: string) => void;
  onAddTask: (task: TaskData) => void;
}

function KanbanColumn({
  id,
  label,
  tasks,
  onUpdateTask,
  onToggle,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const [addingStatusTask, setAddingStatusTask] = useState<string | null>(null);

  return (
    <>
      <div
        ref={setNodeRef}
        className={`kanban-column ${isOver ? "drag-over" : ""}`}
      >
        <div className="kanban-header">
          <strong>{label}</strong>
          <button
            className="add-task-btn"
            onClick={() => setAddingStatusTask(id.replace("status:", ""))}
            type="button"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
        <div className="kanban-tasks">
          {tasks.length === 0 && <p className="no-tasks">No tasks</p>}
          {tasks.map((task) => (
            <TaskDraggable
              key={task.id}
              task={task}
              onUpdate={onUpdateTask}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
      {addingStatusTask && (
        <AddTaskForm
          status={addingStatusTask as TaskData["status"]}
          onAddTask={(task) => {
            onAddTask(task);
            setAddingStatusTask(null);
          }}
          onCancel={() => setAddingStatusTask(null)}
        />
      )}
    </>
  );
}

interface TaskDraggableProps {
  task: TaskData;
  onUpdate: (task: TaskData) => void;
}

interface TaskDraggableProps {
  task: TaskData;
  onUpdate: (task: TaskData) => void;
  onToggle: (id: string) => void; // <-- add this
}

function TaskDraggable({ task, onUpdate, onToggle }: TaskDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.8 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} className="task-card">
      <Task
        task={task}
        onUpdate={onUpdate}
        onToggle={onToggle}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}
