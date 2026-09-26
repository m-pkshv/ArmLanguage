import { createEmptyProgress, migrate } from "./schema";
import type { ProgressData } from "./types";

/** Простое хранилище «ключ → строка». Реализации — в src/platform/storage.ts. */
export interface KeyValueStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const PROGRESS_KEY = "hy:progress";

export interface ProgressStore {
  load(): ProgressData;
  save(data: ProgressData): void;
  clear(): void;
}

export function createProgressStore(storage: KeyValueStorage, clock: () => Date): ProgressStore {
  return {
    load() {
      const text = storage.get(PROGRESS_KEY);
      if (!text) return createEmptyProgress(clock());
      try {
        return migrate(JSON.parse(text), clock());
      } catch {
        // Повреждённые данные не выбрасываем молча: сохраняем копию рядом, чтобы их можно было восстановить.
        storage.set(`${PROGRESS_KEY}:broken:${clock().toISOString()}`, text);
        return createEmptyProgress(clock());
      }
    },
    save(data) {
      storage.set(PROGRESS_KEY, JSON.stringify(data));
    },
    clear() {
      storage.remove(PROGRESS_KEY);
    },
  };
}
