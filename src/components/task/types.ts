// types.ts
export type Priority = "low" | "medium" | "high";

export type TaskStatus = "inbox" | "ready" | "on-hold";

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  date?: Date;
  status?: TaskStatus;
}

