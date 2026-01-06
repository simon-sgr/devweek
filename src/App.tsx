import { useEffect, useState } from "react";
import { TaskData } from "./components/task/types";
import { TaskStore } from "./lib/TaskStore";
import Calendar from "./components/calendar/Calendar";
import { sortTasksByPriority } from "@/utils/taskUtils";

const taskStore = new TaskStore();

function App() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    taskStore.loadTasks().then((loadedTasks) => {
      setTasks(sortTasksByPriority(loadedTasks));
      setLoaded(true);
    });
  }, []);

  /* ---------- handlers ---------- */

  const addTask = async (task: TaskData) => {
    const updated = sortTasksByPriority([...tasks, task]);
    setTasks(updated);
    await taskStore.saveTasks(updated);
  };

  const updateTask = async (updatedTask: TaskData) => {
    const updated = sortTasksByPriority(
      tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setTasks(updated);
    await taskStore.saveTasks(updated);
  };

  const toggleTask = async (id: string) => {
    const updated = sortTasksByPriority(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    setTasks(updated);
    await taskStore.saveTasks(updated);
  };

  if (!loaded) return <div>Loading…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>DevWeek Planner</h1>

      <Calendar
        tasks={tasks}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onToggle={toggleTask}
      />
    </div>
  );
}

export default App;
