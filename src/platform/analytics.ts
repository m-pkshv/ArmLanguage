import { config } from "../config";

// Анонимная статистика посещений через GoatCounter: без cookies и личных данных
// (docs/06-architecture.md, 6.16). События отправляются как условные адреса /event/…
// Если счётчик не настроен (config.goatcounter пуст) или недоступен — ничего не происходит.

let loaded: Promise<void> | null = null;

interface GoatCounter {
  count(vars: { path: string; title?: string; event?: boolean }): void;
}

function load(): Promise<void> {
  if (!config.goatcounter || typeof document === "undefined") return Promise.resolve();
  loaded ??= new Promise((resolve) => {
    (window as unknown as { goatcounter: object }).goatcounter = { no_onload: true };
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${config.goatcounter}.goatcounter.com/count`;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.append(s);
  });
  return loaded;
}

export function track(event: string): void {
  if (!config.goatcounter) return;
  void load().then(() => {
    try {
      (window as unknown as { goatcounter?: GoatCounter }).goatcounter?.count({ path: `event/${event}`, event: true });
    } catch {
      /* статистика не должна мешать работе */
    }
  });
}

/** Просмотр экрана: без hash-частей с id, чтобы не собирать лишнего. */
export function trackScreen(screen: string): void {
  if (!config.goatcounter) return;
  void load().then(() => {
    try {
      (window as unknown as { goatcounter?: GoatCounter }).goatcounter?.count({ path: `screen/${screen}` });
    } catch {
      /* ignore */
    }
  });
}
