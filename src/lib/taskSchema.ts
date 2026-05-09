import { z } from "zod";
import { TaskData, TaskStatus } from "@/components/task/types";
import { parseTaskDate, toDateOnlyKey } from "@/utils/dateUtils";

const prioritySchema = z.enum(["low", "medium", "high"]);
const statusSchema = z.enum(["inbox", "ready", "on-hold"]);

const wireTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  completed: z.boolean(),
  priority: prioritySchema,
  date: z.string().optional(),
  status: statusSchema.optional(),
});

const wireTaskArraySchema = z.array(wireTaskSchema);

const exportedDocumentSchema = z.object({
  version: z.number().int().positive().default(1),
  tasks: wireTaskArraySchema,
});

export type TaskWire = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  date?: string;
  status?: TaskStatus;
};

export type TaskExportDocument = {
  version: number;
  tasks: TaskWire[];
};

function normalizeWireTask(task: z.infer<typeof wireTaskSchema>): TaskWire {
  const normalizedDate = task.date ? toDateOnlyKey(task.date) : null;
  if (task.date && !normalizedDate) {
    throw new Error(`Invalid date value in task ${task.id}`);
  }

  return {
    id: task.id,
    title: task.title.trim(),
    description: task.description?.trim() || undefined,
    completed: task.completed,
    priority: task.priority,
    date: normalizedDate ?? undefined,
    status: task.status,
  };
}

function parseUnknownTaskList(raw: unknown): TaskWire[] {
  if (Array.isArray(raw)) {
    const parsedTasks = wireTaskArraySchema.parse(raw);
    return parsedTasks.map(normalizeWireTask);
  }

  const parsedDocument = exportedDocumentSchema.parse(raw);
  return parsedDocument.tasks.map(normalizeWireTask);
}

export function parseImportJson(jsonData: string): TaskWire[] {
  const parsed = JSON.parse(jsonData) as unknown;
  return parseUnknownTaskList(parsed);
}

export function parseStoredTasks(raw: unknown): TaskWire[] {
  if (!raw) return [];
  return parseUnknownTaskList(raw);
}

export function toTaskData(task: TaskWire): TaskData {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    priority: task.priority,
    date: task.date ? parseTaskDate(task.date) ?? undefined : undefined,
    status: task.status,
  };
}

export function toTaskWire(task: TaskData): TaskWire {
  const normalizedDate = toDateOnlyKey(task.date);

  return {
    id: task.id,
    title: task.title.trim(),
    description: task.description?.trim() || undefined,
    completed: task.completed,
    priority: task.priority,
    date: normalizedDate ?? undefined,
    status: task.status,
  };
}

export function toExportDocument(tasks: TaskData[]): TaskExportDocument {
  return {
    version: 1,
    tasks: tasks.map(toTaskWire),
  };
}
