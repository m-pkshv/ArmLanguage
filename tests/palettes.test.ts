// Цветовые темы (docs/05-ui-mobile.md, 5.5; docs/11-design.md): полнота наборов переменных в palettes.css,
// совпадение образцов в настройках с настоящими цветами, контраст текста (WCAG AA) и шкала карты алфавита.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PALETTES, themeColor } from "../src/app/palettes";
import { mapLevel } from "../src/core/stats";
import { PALETTE_IDS } from "../src/core/progress/types";
import { DEFAULT_SETTINGS } from "../src/core/progress/schema";

const css = readFileSync("src/styles/palettes.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Блоки CSS: селектор → переменные. Вложенные блоки @media разворачиваются. */
function blocks(): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of css.matchAll(re)) {
    const selector = m[1]!.replace(/@media[^{]*\{/, "").trim();
    const media = /@media/.test(m[1]!) || /\(prefers-color-scheme/.test(css.slice(Math.max(0, m.index! - 60), m.index!));
    const vars: Record<string, string> = {};
    for (const [, name, value] of m[2]!.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[name!] = value!.trim();
    out.set((media ? "@media " : "") + selector, vars);
  }
  return out;
}

const all = blocks();
const selectorOf = (id: string, mode: "light" | "dark" | "media") => {
  const base = id === "ink" ? ":root" : `:root[data-palette="${id}"]`;
  if (mode === "light") return base;
  if (mode === "dark") return `${base}[data-theme="dark"]`;
  return `@media ${base}:not([data-theme="light"])`;
};
const vars = (id: string, mode: "light" | "dark" | "media") => {
  const v = all.get(selectorOf(id, mode));
  if (!v) throw new Error(`нет блока ${selectorOf(id, mode)}`);
  return v;
};
/** Итоговые переменные темы: тёмный блок поверх светлого (скругления и шрифты задаются только в светлом). */
const resolved = (id: string, dark: boolean) => (dark ? { ...vars(id, "light"), ...vars(id, "dark") } : vars(id, "light"));

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

describe("palettes.css", () => {
  it("has light, dark and system-dark blocks for every palette", () => {
    for (const id of PALETTE_IDS) for (const mode of ["light", "dark", "media"] as const) expect(() => vars(id, mode)).not.toThrow();
  });

  it("defines the same color variables in every block, dark twins line by line", () => {
    const colorKeys = Object.keys(vars("ink", "dark")).sort();
    for (const id of PALETTE_IDS) {
      expect(Object.keys(vars(id, "dark")).sort()).toEqual(colorKeys);
      expect(vars(id, "media")).toEqual(vars(id, "dark"));
      // светлый блок — те же цвета плюс скругления, шрифт заголовков и вид ссылок
      const light = Object.keys(vars(id, "light"));
      for (const k of colorKeys) expect(light).toContain(k);
      for (const k of ["--radius", "--radius-lg", "--font-head", "--link-decoration"]) expect(light).toContain(k);
    }
  });

  it("matches the settings swatches and browser color to the real colors", () => {
    for (const p of PALETTES) {
      for (const dark of [false, true]) {
        const v = resolved(p.id, dark);
        const sw = dark ? p.dark : p.light;
        expect(sw).toEqual({ bg: v["--bg"], surface: v["--surface"], accent: v["--accent"], good: v["--good"], text: v["--text"] });
        expect(themeColor(p.id, dark)).toBe(v["--bg"]);
      }
    }
  });

  it("keeps text contrast at WCAG AA (4.5:1) in every palette and mode", () => {
    const pairs: [string, string][] = [
      ["--text", "--bg"],
      ["--text", "--surface"],
      ["--text", "--surface-2"],
      ["--muted", "--bg"],
      ["--muted", "--surface"],
      ["--muted", "--surface-2"],
      ["--accent-text", "--accent"],
      ["--accent-text", "--accent-pressed"],
      ["--accent", "--surface"],
      ["--accent", "--accent-soft"],
      ["--text", "--accent-soft"],
      ["--text", "--good-soft"],
      ["--text", "--warn-soft"],
      ["--text", "--bad-soft"],
      ["--good", "--good-soft"],
      ["--warn", "--warn-soft"],
      ["--bad", "--bad-soft"],
      ["--on-status", "--good"],
      ["--on-status", "--bad"],
      ["--on-status", "--warn"],
      ["--muted", "--line"],
      ["--text", "--lvl-1"],
      ["--text", "--lvl-2"],
      ["--text", "--lvl-3"],
      ["--text", "--lvl-4"],
      ["--lvl-5-text", "--lvl-5"],
      ["--lvl-text-strong", "--lvl-6"],
    ];
    for (const id of PALETTE_IDS) {
      for (const dark of [false, true]) {
        const v = resolved(id, dark);
        for (const [fg, bg] of pairs) {
          const ratio = contrast(v[fg]!, v[bg]!);
          expect(ratio, `${id} ${dark ? "тёмная" : "светлая"}: ${fg} на ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("lists the default palette first", () => {
    expect(PALETTES.map((p) => p.id)).toEqual([...PALETTE_IDS]);
    expect(PALETTES[0]!.id).toBe(DEFAULT_SETTINGS.palette);
    expect(DEFAULT_SETTINGS.palette).toBe("ink");
  });
});

describe("mapLevel", () => {
  it("maps knowledge 0–5 (possibly fractional) to map levels 1–6", () => {
    expect(mapLevel(null)).toBeNull();
    expect(mapLevel(0)).toBe(1);
    expect(mapLevel(0.5)).toBe(1);
    expect(mapLevel(2.5)).toBe(3);
    expect(mapLevel(5)).toBe(6);
    expect(mapLevel(7)).toBe(6);
  });
});
