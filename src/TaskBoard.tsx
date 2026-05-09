import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type CollisionDetection,
  KeyboardSensor,
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TaskStore } from "./lib/TaskStore";
import { TaskData, TaskStatus } from "./components/task/types";
import { sortTasks } from "./utils/taskUtils";
import Calendar from "./components/calendar/Calendar";
import Kanban from "./components/board/Kanban";

const taskStore = new TaskStore();

export default function TaskBoard() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadTasks = useCallback(async () => {
    const loadedTasks = await taskStore.loadTasks();
    setTasks(sortTasks(loadedTasks));
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadTasks();

    const handleTasksChanged = () => {
      loadTasks();
    };

    window.addEventListener("tasks:changed", handleTasksChanged);
    return () => {
      window.removeEventListener("tasks:changed", handleTasksChanged);
    };
  }, [loadTasks]);

  const saveAndSet = async (updatedTasks: TaskData[]) => {
    setTasks(sortTasks(updatedTasks));
    await taskStore.saveTasks(updatedTasks);
  };

  // Toggle completion checkbox
  const onToggleTask = async (id: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id !== id) return task;

      const isToggleToComplete = !task.completed;

      // If completing a kanban task (has status, no date), move to today
      if (isToggleToComplete && task.status && !task.date) {
        return {
          ...task,
          completed: true,
          date: new Date(),
          status: undefined,
        };
      }

      // Otherwise just toggle completion
      return {
        ...task,
        completed: !task.completed,
      };
    });
    await saveAndSet(updatedTasks);
  };

  // Update full task (e.g. description, priority)
  const onUpdateTask = async (updatedTask: TaskData) => {
    const updatedTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t,
    );
    await saveAndSet(updatedTasks);
  };

  const onDeleteTask = async (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    await saveAndSet(updatedTasks);
  };

  const addTask = async (task: TaskData) => {
    const updated = sortTasks([...tasks, task]);
    setTasks(updated);
    await taskStore.saveTasks(updated);
  };

  // Handle drag & drop across Calendar and Kanban
  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return; // no change

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    let updatedTask = { ...activeTask };

    // Parsing droppable IDs:
    // Calendar days: "date:YYYY-MM-DD"
    // Kanban columns: "status:inbox" | "status:ready" | "status:on-hold"

    const overId = String(over.id);

    if (overId.startsWith("date:")) {
      // Dropped on a calendar day ? update date, clear status
      const newDate = overId.replace("date:", "");
      updatedTask.date = new Date(newDate);
      updatedTask.status = undefined;
    } else if (overId.startsWith("status:")) {
      // Dropped on Kanban column ? clear date, update status
      updatedTask.status = overId.replace("status:", "") as TaskStatus;
      updatedTask.date = undefined;
    } else {
      return; // invalid drop target
    }

    // Update tasks list
    const updatedTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t,
    );

    await saveAndSet(updatedTasks);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
      bypassActivationConstraint: ({ event }) => {
        const target = event.target as HTMLElement | null;

        return Boolean(target?.closest(".drag-handle"));
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [calendarTasks, kanbanTasks] = useMemo(() => {
    const calendar: TaskData[] = [];
    const kanban: TaskData[] = [];

    for (const task of tasks) {
      if (task.date) {
        calendar.push(task);
      } else {
        kanban.push(task);
      }
    }

    return [calendar, kanban];
  }, [tasks]);

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    return closestCenter(args);
  };

  return (
    <>
      {!loaded ? (
        <div className="board-loading">Loading your workspace</div>
      ) : (
        <DndContext
          onDragEnd={onDragEnd}
          sensors={sensors}
          collisionDetection={collisionDetection}
        >
          <div className="board-stack">
            <Calendar
              tasks={calendarTasks}
              onUpdateTask={onUpdateTask}
              onToggle={onToggleTask}
              onDeleteTask={onDeleteTask}
              onAddTask={addTask}
            />

            <Kanban
              tasks={kanbanTasks}
              onUpdateTask={onUpdateTask}
              onToggle={onToggleTask}
              onDeleteTask={onDeleteTask}
              onAddTask={addTask}
            />
          </div>
        </DndContext>
      )}
    </>
  );
}
