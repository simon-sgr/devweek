import { load, Store } from '@tauri-apps/plugin-store';

export type ThemePreference = "light" | "dark" | "system";

const themePreferenceKey = "themePreference";
const autoMoveTasksCheckedKey = "autoMoveTasksChecked";

export class SettingStore {
    private store?: Store;

    private async initStore() {
        if (!this.store) {
            this.store = await load("settings.json", {
                autoSave: true,
                defaults: {},
            });
        }
        return this.store;
    } 
    async getSetting<T>(key: string): Promise<T | null> {
        const store = await this.initStore();
        const value = await store.get<T>(key);
        return value ?? null;
    }
    async setSetting<T>(key: string, value: T): Promise<void> {
        const store = await this.initStore();
        await store.set(key, value);
        await store.save();
    }
    async deleteSetting(key: string): Promise<void> {
        const store = await this.initStore();
        await store.delete(key);
        await store.save();
    }
    async clearSettings(): Promise<void> {
        const store = await this.initStore();
        await store.clear();
        await store.save();
    }

    async setAutoMoveTasks(value: boolean): Promise<void> {
        await this.setSetting<boolean>('autoMoveTasks', value);
    }

    async getAutoMoveTasks(): Promise<boolean> {
        const value = await this.getSetting<boolean>('autoMoveTasks');
        return value ?? false; // default to false if not set
    }

    async setAutoMoveTasksChecked(value: string): Promise<void> {
        await this.setSetting<string>(autoMoveTasksCheckedKey, value);
    }

    async getAutoMoveTasksChecked(): Promise<string | null> {
        return await this.getSetting<string>(autoMoveTasksCheckedKey);
    }

    async setThemePreference(value: ThemePreference): Promise<void> {
        await this.setSetting<ThemePreference>(themePreferenceKey, value);
    }

    async getThemePreference(): Promise<ThemePreference> {
        const value = await this.getSetting<ThemePreference>(themePreferenceKey);
        return value ?? "system";
    }
}