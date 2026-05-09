import { TaskData } from "@/components/task/types";
import { load, Store } from '@tauri-apps/plugin-store';
import { SettingStore } from "./SettingStore";
import {
  parseImportJson,
  parseStoredTasks,
  toExportDocument,
  toTaskData,
  toTaskWire,
} from "./taskSchema";
import { toDateOnlyKey } from "@/utils/dateUtils";

export class TaskStore {
  private store?: Store;
  private readonly key = "tasks";

  private getLocalDateKey(value: Date): string {
    return toDateOnlyKey(value) ?? "";
  }

  private toDate(value: Date | string | undefined): Date | null {
    if (!value) return null;

    const parsedDate = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private async initStore() {
    if (!this.store) {
      this.store = await load("tasks.json", {
        autoSave: true,
        defaults: {},
      });
    }
    return this.store;
  }

  async loadTasks(): Promise<TaskData[]> {
    const store = await this.initStore();
    const rawTasks = await store.get<unknown>(this.key);

    try {
      const parsedTasks = parseStoredTasks(rawTasks);
      return parsedTasks.map(toTaskData);
    } catch (error) {
      console.error("Failed to parse stored tasks", error);
      return [];
    }
  }

  async saveTasks(tasks: TaskData[]): Promise<void> {
    const store = await this.initStore();
    await store.set(this.key, tasks.map(toTaskWire));
    await store.save();
  }

  async addTask(task: TaskData): Promise<void> {
    const tasks = await this.loadTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
  }

  async updateTask(updatedTask: TaskData): Promise<void> {
    const tasks = await this.loadTasks();
    const index = tasks.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      await this.saveTasks(tasks);
    } else {
      throw new Error(`Task with id ${updatedTask.id} not found`);
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.loadTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    await this.saveTasks(filtered);
  }

  async exportTasks(): Promise<string> {
    const tasks = await this.loadTasks();
    return JSON.stringify(toExportDocument(tasks), null, 2);
  }
  async importTasks(jsonData: string): Promise<void> {
    const parsedTasks = parseImportJson(jsonData);
    await this.saveTasks(parsedTasks.map(toTaskData));
  }

  async moveOverdueOpenTasksToToday(
    settingStore: SettingStore,
  ): Promise<boolean> {
    const enabled = await settingStore.getAutoMoveTasks();
    if (!enabled) return false;

    const today = new Date();
    const todayKey = this.getLocalDateKey(today);
    const lastChecked = await settingStore.getAutoMoveTasksChecked();

    if (lastChecked === todayKey) {
      return false;
    }

    const tasks = await this.loadTasks();
    let changed = false;

    const updatedTasks = tasks.map((task) => {
      // Only move calendar tasks: overdue open tasks to today
      if (task.completed || !task.date) return task;

      const taskDate = this.toDate(task.date);
      if (!taskDate) return task;

      const taskDateKey = this.getLocalDateKey(taskDate);
      if (taskDateKey >= todayKey) return task;

      changed = true;
      return {
        ...task,
        date: new Date(today),
      };
    });

    if (changed) {
      await this.saveTasks(updatedTasks);
    }

    await settingStore.setAutoMoveTasksChecked(todayKey);
    return changed;
  }
}