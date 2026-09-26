import { addDays, type Day } from "../dates";
import type { ItemProgress } from "./types";

// Интервальное повторение: коробки Лейтнера 0–5 (docs/02-features.md, 2.6).
// Интервал до следующего показа: сегодня → 1 день → 3 → 7 → 16 → 35 дней.
export const INTERVALS = [0, 1, 3, 7, 16, 35] as const;
export const MAX_BOX = INTERVALS.length - 1;

export type Verdict = "correct" | "partial" | "wrong";

export function newItem(today: Day): ItemProgress {
  return { box: 0, due: today, ok: 0, bad: 0, last: today };
}

/**
 * Учитывает ответ.
 * - Верно: в следующую коробку, но только если пора было повторять. Повторные верные ответы
 *   в тот же день коробку не поднимают — иначе интервалы теряют смысл.
 * - Почти: коробка не меняется.
 * - Неверно: на 2 коробки назад (не ниже 0), повторить сегодня.
 */
export function review(state: ItemProgress | undefined, verdict: Verdict, today: Day): ItemProgress {
  const s = state ? { ...state } : newItem(today);
  const wasDue = s.due <= today;
  if (verdict === "correct") {
    s.ok++;
    if (wasDue) {
      s.box = Math.min(MAX_BOX, s.box + 1);
      s.due = addDays(today, INTERVALS[s.box]!);
    }
  } else if (verdict === "partial") {
    s.ok++;
    if (wasDue && s.box > 0) s.due = addDays(today, INTERVALS[s.box]!);
  } else {
    s.bad++;
    s.box = Math.max(0, s.box - 2);
    s.due = today;
  }
  s.last = today;
  return s;
}
