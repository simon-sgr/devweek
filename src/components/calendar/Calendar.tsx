import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";

import { getCurrentWorkWeek } from "@/utils/dateUtils";
import { TaskData } from "../task/types";
import Task from "../task/Task";
import AddTaskForm from "../task/AddTaskForm";
import "./Calendar.css";

interface CalendarProps {
  tasks: TaskData[];
  onAddTask: (task: TaskData) => void;
  onUpdateTask: (task: TaskData) => void;
  onToggle: (id: string) => void;
}

export default function Calendar({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggle,
}: CalendarProps) {
  const weekDays = getCurrentWorkWeek();
  const todayStr = new Date().toISOString().slice(0, 10);

  const sensors = useSensors(useSensor(PointerSensor));

  const [addingDate, setAddingDate] = useState<string | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newDate = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.date !== newDate) {
      onUpdateTask({ ...task, date: newDate });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="calendar">
        {weekDays.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const dayTasks = tasks.filter((t) => t.date === dateStr);

          return (
            <DroppableDay key={dateStr} id={dateStr} isToday={isToday}>
              <div className="calendar-day-header">
                <strong>
                  {date.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </strong>

                <button
                  className="add-task-btn"
                  onClick={() => setAddingDate(dateStr)}
                >
                  + Add
                </button>
              </div>

              <div className="calendar-tasks">
                {dayTasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onUpdate={onUpdateTask}
                  />
                ))}
              </div>
            </DroppableDay>
          );
        })}
      </div>

      {/* Modal */}
      {addingDate && (
        <AddTaskForm
          date={addingDate}
          onAddTask={(task) => {
            onAddTask(task);
            setAddingDate(null);
          }}
          onCancel={() => setAddingDate(null)}
        />
      )}
    </DndContext>
  );
}

/* ---------- helpers ---------- */

function DroppableDay({
  id,
  isToday,
  children,
}: {
  id: string;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`calendar-day ${isToday ? "today" : ""} ${
        isOver ? "droppable-over" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DraggableTask({
  task,
  onUpdate,
  onToggle,
}: {
  task: TaskData;
  onUpdate: (task: TaskData) => void;
  onToggle: (id: string) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useDraggable({ id: task.id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.7 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Task task={task} onUpdate={onUpdate} onToggle={onToggle} />
    </div>
  );
}
