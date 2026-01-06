import { TaskData } from "@/components/task/types";

const priorityOrder: Record<TaskData["priority"], number> = {
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasksByPriority(tasks: TaskData[]): TaskData[] {
  return [...tasks].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}
