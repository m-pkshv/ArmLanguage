import { parseHash, type Route } from "./routes";

class Router {
  current = $state<Route>(parseHash(location.hash));

  constructor() {
    window.addEventListener("hashchange", () => {
      this.current = parseHash(location.hash);
      window.scrollTo(0, 0);
    });
  }

  /** Назад по истории; если истории нет (открыли по ссылке) — на указанный экран. */
  back(fallback: string) {
    if (history.length > 1) history.back();
    else location.hash = fallback;
  }
}

export const router = new Router();
