import type { KeyValueStorage } from "../core/progress/store";

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

/**
 * Хранилище браузера. Если localStorage недоступен (приватный режим, запрет сайта),
 * работаем в памяти и сообщаем об этом — интерфейс покажет предупреждение.
 */
export function createBrowserStorage(): { storage: KeyValueStorage; persistent: boolean } {
  try {
    const ls = window.localStorage;
    const probe = "hy:probe";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return {
      persistent: true,
      storage: {
        get: (k) => ls.getItem(k),
        set: (k, v) => ls.setItem(k, v),
        remove: (k) => ls.removeItem(k),
      },
    };
  } catch {
    return { persistent: false, storage: memoryStorage() };
  }
}

/** Просим браузер не удалять данные сайта при нехватке места. Ответ не критичен. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Отдаёт пользователю текстовый файл (резервную копию). */
export function downloadTextFile(name: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
