import { TaskData } from "@/components/task/types";

const priorityOrder: Record<TaskData["priority"], number> = {
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasks(tasks: TaskData[]): TaskData[] {
  return [...tasks].sort((a, b) => {
    // 1 Completed last
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // 2 Priority
    const prioDiff =
      priorityOrder[a.priority] - priorityOrder[b.priority];
    if (prioDiff !== 0) {
      return prioDiff;
    }

    // 3 Name (title)
    return a.title.localeCompare(b.title, undefined, {
      sensitivity: "base",
    });
  });
}