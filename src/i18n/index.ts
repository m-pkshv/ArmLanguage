import ru from "./ru.json";

// Все тексты интерфейса — в ru.json (см. docs/06-architecture.md, 6.13).
// t("home.lettersLearned", { n: 5 }) → «Выучено 5 из 39 букв»

type Dict = { [key: string]: string | Dict };

export function t(key: string, params: Record<string, string | number> = {}): string {
  let node: string | Dict | undefined = ru as Dict;
  for (const part of key.split(".")) {
    node = typeof node === "object" ? node[part] : undefined;
  }
  if (typeof node !== "string") {
    if (import.meta.env.DEV) console.warn(`Нет текста для ключа «${key}»`);
    return key;
  }
  return node.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}
