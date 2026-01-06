import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TaskStore } from "./lib/TaskStore";
import { TaskData, TaskStatus } from "./components/task/types";
import { sortTasks } from "./utils/taskUtils";
import Calendar from "./components/calendar/Calendar";
import Kanban from "./components/board/Kanban";

const taskStore = new TaskStore();

export default function TaskBoard() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const loadedTasks = await taskStore.loadTasks();
      setTasks(sortTasks(loadedTasks));
      setLoaded(true);
    }
    load();
  }, []);

  const saveAndSet = async (updatedTasks: TaskData[]) => {
    setTasks(sortTasks(updatedTasks));
    await taskStore.saveTasks(updatedTasks);
  };

  // Toggle completion checkbox
  const onToggleTask = async (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await saveAndSet(updatedTasks);
  };

  // Update full task (e.g. description, priority)
  const onUpdateTask = async (updatedTask: TaskData) => {
    const updatedTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
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
      updatedTask.date = newDate;
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
      t.id === updatedTask.id ? updatedTask : t
    );

    await saveAndSet(updatedTasks);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  if (!loaded) return <div>Loading…</div>;

  // Separate calendar tasks (have a date) and kanban tasks (no date)
  console.log("Rendering TaskBoard with tasks:", tasks);
  const calendarTasks = tasks.filter((t) => t.date);
  const kanbanTasks = tasks.filter((t) => !t.date);
  console.log("Calendar tasks:", calendarTasks);
  console.log("Kanban tasks:", kanbanTasks);

  return (
    <DndContext
      onDragEnd={onDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column", // stack vertically instead of row
          gap: 24,
          padding: 16,
          margin: "0 auto",
        }}
      >
        <Calendar
          tasks={calendarTasks}
          onUpdateTask={onUpdateTask}
          onToggle={onToggleTask}
          onAddTask={addTask}
        />

        <Kanban
          tasks={kanbanTasks}
          onUpdateTask={onUpdateTask}
          onToggle={onToggleTask}
          onAddTask={addTask}
        />
      </div>
    </DndContext>
  );
}
