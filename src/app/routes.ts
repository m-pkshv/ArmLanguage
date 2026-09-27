// Адреса экранов (hash-маршруты, см. docs/06-architecture.md, 6.10 и docs/09-navigation.md, 9.2).

export type Tab = "learn" | "alphabet" | "practice" | "profile";

export type Route =
  | { name: "home" }
  | { name: "lessons" }
  | { name: "lesson"; id: string }
  | { name: "session" }
  | { name: "alphabet" }
  | { name: "letter"; id: string }
  | { name: "practice" }
  | { name: "custom" }
  | { name: "pairs" }
  | { name: "match" }
  | { name: "profile" }
  | { name: "stats" }
  | { name: "settings" }
  | { name: "backup" }
  | { name: "about" }
  | { name: "credits" }
  | { name: "not-found"; path: string };

/** К какой вкладке нижней панели относится экран; null — панель скрыта (занятие) или не выделена. */
export function tabOf(route: Route): Tab | null {
  switch (route.name) {
    case "home":
    case "lessons":
    case "lesson":
      return "learn";
    case "alphabet":
    case "letter":
      return "alphabet";
    case "practice":
    case "custom":
    case "pairs":
    case "match":
      return "practice";
    case "profile":
    case "stats":
    case "settings":
    case "backup":
    case "about":
    case "credits":
      return "profile";
    default:
      return null;
  }
}

const SIMPLE = ["lessons", "session", "practice", "profile", "stats", "settings", "backup", "about", "credits"] as const;

/** "#/alphabet/tho" → { name: "letter", id: "tho" } */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const [first, second, ...rest] = parts;
  if (rest.length) return { name: "not-found", path };
  if (!first) return { name: "home" };
  if (first === "alphabet") return second ? { name: "letter", id: decodeURIComponent(second) } : { name: "alphabet" };
  if (first === "lesson" && second) return { name: "lesson", id: decodeURIComponent(second) };
  if (first === "practice" && second === "custom") return { name: "custom" };
  if (first === "practice" && second === "pairs") return { name: "pairs" };
  if (first === "practice" && second === "match") return { name: "match" };
  if (second) return { name: "not-found", path };
  if ((SIMPLE as readonly string[]).includes(first)) return { name: first as (typeof SIMPLE)[number] };
  return { name: "not-found", path };
}

export function hrefOf(route: Route): string {
  switch (route.name) {
    case "home":
    case "not-found":
      return "#/";
    case "letter":
      return `#/alphabet/${encodeURIComponent(route.id)}`;
    case "lesson":
      return `#/lesson/${encodeURIComponent(route.id)}`;
    case "custom":
      return "#/practice/custom";
    case "pairs":
      return "#/practice/pairs";
    case "match":
      return "#/practice/match";
    default:
      return `#/${route.name}`;
  }
}
