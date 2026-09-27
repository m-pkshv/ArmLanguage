// Цветовые темы (палитры) — docs/05-ui-mobile.md, 5.5; цвета — docs/11-design.md.
// Сами переменные CSS — в src/styles/palettes.css; здесь — то, что нужно коду: порядок в настройках,
// цвета образцов (карточки рисуются своими цветами, а не цветами текущей темы) и цвет панели браузера.
import type { Palette } from "../core/progress/types";

export interface PaletteSwatch {
  bg: string;
  surface: string;
  accent: string;
  good: string;
  text: string;
}

export interface PaletteInfo {
  id: Palette;
  light: PaletteSwatch;
  dark: PaletteSwatch;
}

/** Порядок — как в настройках. Первая — тема по умолчанию. */
export const PALETTES: readonly PaletteInfo[] = [
  {
    id: "ink",
    light: { bg: "#f6f5f2", surface: "#ffffff", accent: "#1f1f24", good: "#15803d", text: "#19191c" },
    dark: { bg: "#101012", surface: "#19191c", accent: "#ececee", good: "#4ade80", text: "#ececee" },
  },
  {
    id: "sevan",
    light: { bg: "#f3f6f7", surface: "#ffffff", accent: "#1d5fa6", good: "#15803d", text: "#14212b" },
    dark: { bg: "#0e1519", surface: "#162027", accent: "#7db3f0", good: "#4ade80", text: "#e5edf2" },
  },
  {
    id: "pine",
    light: { bg: "#f5f0e6", surface: "#fffcf5", accent: "#1f5a3d", good: "#15803d", text: "#26221c" },
    dark: { bg: "#191712", surface: "#221f19", accent: "#8cc7a1", good: "#4ade80", text: "#efe7d8" },
  },
];

export function paletteInfo(id: Palette): PaletteInfo {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

/** Цвет панели браузера (`theme-color`) — фон темы в текущем виде. */
export function themeColor(id: Palette, dark: boolean): string {
  const p = paletteInfo(id);
  return dark ? p.dark.bg : p.light.bg;
}
