import { TaskData } from "@/components/task/types";
import { load, Store } from '@tauri-apps/plugin-store';
import { SettingStore } from "./SettingStore";

export class TaskStore {
  private store?: Store;
  private readonly key = "tasks";

  private getLocalDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    const tasks = await store.get<TaskData[]>(this.key);
    return tasks ?? [];
  }

  async saveTasks(tasks: TaskData[]): Promise<void> {
    const store = await this.initStore();
    await store.set(this.key, tasks);
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
    return JSON.stringify(tasks, null, 2);
  }
  async importTasks(jsonData: string): Promise<void> {
    const tasks: TaskData[] = JSON.parse(jsonData);
    await this.saveTasks(tasks);
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