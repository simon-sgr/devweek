import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";

import {
  getCurrentWorkWeek,
  getNextWorkWeek,
  getPreviousWorkWeek,
} from "@/utils/dateUtils";
import { TaskData } from "../task/types";
import Task from "../task/Task";
import AddTaskForm from "../task/AddTaskForm";
import "../../styles/TaskHolder.css";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

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
  const [currentWeek, setCurrentWeek] = useState<Date[]>(getCurrentWorkWeek());
  const todayStr = new Date().toISOString().slice(0, 10);

  console.log("Current week start:", currentWeek);
  console.log("Week days:", currentWeek);
  const [addingDate, setAddingDate] = useState<Date | null>(null);

  const goToNextWeek = () => {
    setCurrentWeek(getNextWorkWeek(currentWeek[0]));
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(getPreviousWorkWeek(currentWeek[0]));
  };

  const goToToday = () => {
    setCurrentWeek(getCurrentWorkWeek());
  };

  return (
    <>
      <div className="calendar-container">
        <div className="calendar-navigation">
          <button onClick={goToPreviousWeek} className="nav-btn">
            <ChevronLeft size={20} /> Previous
          </button>
          <button onClick={goToToday} className="nav-btn today-btn">
            Today
          </button>
          <button onClick={goToNextWeek} className="nav-btn">
            Next <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar">
          {currentWeek.map((date) => {
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            const dayTasks = tasks.filter((t) => {
              if (!t.date || !date) return false;

              const taskDate =
                t.date instanceof Date ? t.date : new Date(t.date);
              return taskDate.toDateString() === date.toDateString();
            });

            return (
              <DroppableDay
                key={dateStr}
                id={`date:${dateStr}`}
                isToday={isToday}
              >
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
                    onClick={() => setAddingDate(new Date(dateStr))}
                    type="button"
                  >
                    <Plus size={16} /> Add Task
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
      </div>

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
    </>
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
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Task
        task={task}
        onUpdate={onUpdate}
        onToggle={onToggle}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}
