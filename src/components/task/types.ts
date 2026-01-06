// types.ts
export type Priority = "low" | "medium" | "high";

export type TaskStatus = "inbox" | "ready" | "on-hold";

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  date?: string; // ISO date string, e.g. "2026-01-06"
  status?: TaskStatus; // no date -> Kanban status
}

