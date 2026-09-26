// Адреса экранов (hash-маршруты, см. docs/06-architecture.md, 6.10 и docs/05-ui-mobile.md, 5.3).

export type Tab = "learn" | "alphabet" | "practice" | "profile";

export type Route =
  | { name: "home" }
  | { name: "alphabet" }
  | { name: "letter"; id: string }
  | { name: "practice" }
  | { name: "profile" }
  | { name: "settings" }
  | { name: "backup" }
  | { name: "about" }
  | { name: "credits" }
  | { name: "not-found"; path: string };

/** К какой вкладке нижней панели относится экран. */
export function tabOf(route: Route): Tab | null {
  switch (route.name) {
    case "home":
      return "learn";
    case "alphabet":
    case "letter":
      return "alphabet";
    case "practice":
      return "practice";
    case "profile":
    case "settings":
    case "backup":
    case "about":
    case "credits":
      return "profile";
    default:
      return null;
  }
}

/** "#/alphabet/tho" → { name: "letter", id: "tho" } */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const [first, second, ...rest] = parts;
  if (rest.length) return { name: "not-found", path };
  if (!first) return { name: "home" };
  if (first === "alphabet") return second ? { name: "letter", id: decodeURIComponent(second) } : { name: "alphabet" };
  if (second) return { name: "not-found", path };
  switch (first) {
    case "practice":
    case "profile":
    case "settings":
    case "backup":
    case "about":
    case "credits":
      return { name: first };
    default:
      return { name: "not-found", path };
  }
}

export function hrefOf(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "letter":
      return `#/alphabet/${encodeURIComponent(route.id)}`;
    case "not-found":
      return "#/";
    default:
      return `#/${route.name}`;
  }
}
