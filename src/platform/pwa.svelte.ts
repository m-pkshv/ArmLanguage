import { registerSW } from "virtual:pwa-register";

// Обновление приложения: новая версия скачивается в фоне, а применяется по кнопке «Обновить»
// (docs/09-navigation.md, 9.14). Во время занятия кнопку не показываем.

class PwaState {
  needRefresh = $state(false);
  private update: ((reload?: boolean) => Promise<void>) | null = null;

  init() {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    this.update = registerSW({
      onNeedRefresh: () => (this.needRefresh = true),
    });
  }

  apply() {
    void this.update?.(true);
  }
}

export const pwa = new PwaState();
