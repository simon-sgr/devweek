import { TaskData } from "@/components/task/types";
import { load, Store } from '@tauri-apps/plugin-store';

export class TaskStore {
  private store?: Store;
  private readonly key = "tasks";

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
}