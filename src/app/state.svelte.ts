import { createEmptyProgress } from "../core/progress/schema";
import { createProgressStore } from "../core/progress/store";
import type { ProgressData, Settings } from "../core/progress/types";
import { createBrowserStorage, requestPersistentStorage } from "../platform/storage";

const now = () => new Date();
const { storage, persistent } = createBrowserStorage();
const store = createProgressStore(storage, now);

/** Общее состояние приложения: прогресс пользователя и доступность хранилища. */
class AppState {
  progress = $state<ProgressData>(store.load());
  /** false — прогресс не сохранится после закрытия (например, режим «инкогнито»). */
  readonly storagePersistent = persistent;

  private commit() {
    store.save($state.snapshot(this.progress) as ProgressData);
  }

  updateSettings(patch: Partial<Settings>) {
    Object.assign(this.progress.settings, patch);
    this.commit();
  }

  markBackupSaved() {
    this.progress.meta.lastBackupAt = now().toISOString();
    this.commit();
  }

  replaceProgress(data: ProgressData) {
    this.progress = data;
    this.commit();
  }

  resetProgress() {
    // Настройки оформления сохраняем: сброс касается учебного прогресса.
    const settings = $state.snapshot(this.progress.settings);
    this.progress = { ...createEmptyProgress(now()), settings };
    this.commit();
  }
}

export const app = new AppState();

if (persistent) void requestPersistentStorage();
