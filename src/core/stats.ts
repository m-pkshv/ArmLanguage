import type { Content } from "./content/types";
import { addDays, daysBetween, type Day } from "./dates";
import { boxOf, isLearned, isSeen, itemOf } from "./progress/knowledge";
import type { ProgressData, Skill } from "./progress/types";

// Экран «Статистика» (docs/02-features.md, 2.7): итоги, карта алфавита, частые путаницы, активность.
// Только чтение прогресса — ничего не сохраняет.

export interface Summary {
  learned: number;
  learning: number;
  /** Дней, в которые были ответы. */
  days: number;
  /** Дней подряд, включая сегодня (или до вчера, если сегодня ещё не занимались). */
  streak: number;
  answers: number;
  /** Доля верных ответов 0–1 (null — ответов ещё не было). */
  accuracy: number | null;
}

export function summary(p: ProgressData, c: Content, today: Day): Summary {
  const days = Object.entries(p.daily).filter(([, d]) => d.answers > 0);
  const answers = days.reduce((n, [, d]) => n + d.answers, 0);
  const correct = days.reduce((n, [, d]) => n + d.correct, 0);
  const active = new Set(days.map(([day]) => day));
  let streak = 0;
  let day = active.has(today) ? today : addDays(today, -1);
  while (active.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return {
    learned: c.letters.filter((l) => isLearned(p, l.id)).length,
    learning: c.letters.filter((l) => isSeen(p, l.id) && !isLearned(p, l.id)).length,
    days: active.size,
    streak,
    answers,
    accuracy: answers ? correct / answers : null,
  };
}

/** Что показывает карта алфавита: основные навыки или один из дополнительных. */
export type MapView = "main" | "read" | "handwriting" | "case";

/**
 * Уровень знания буквы для карты: 0–5 (коробка интервального повторения), null — буква ещё не встречалась.
 * «Основное» — среднее узнавания и вспоминания.
 */
export function letterLevel(p: ProgressData, letterId: string, view: MapView): number | null {
  if (view === "main") return isSeen(p, letterId) ? (boxOf(p, letterId, "recognize") + boxOf(p, letterId, "recall")) / 2 : null;
  const skill: Skill = view;
  return itemOf(p, letterId, skill) ? boxOf(p, letterId, skill) : null;
}

export interface ConfusionPair {
  a: string;
  b: string;
  count: number;
}

/** Самые частые путаницы; Տ→Թ и Թ→Տ считаются одной парой. */
export function topConfusions(p: ProgressData, limit = 5): ConfusionPair[] {
  const pairs = new Map<string, ConfusionPair>();
  for (const [key, count] of Object.entries(p.confusions)) {
    const m = /^letter:(.+)>letter:(.+)$/.exec(key);
    if (!m || !count) continue;
    const [a, b] = [m[1]!, m[2]!].sort() as [string, string];
    const pair = pairs.get(`${a}|${b}`) ?? { a, b, count: 0 };
    pair.count += count;
    pairs.set(`${a}|${b}`, pair);
  }
  return [...pairs.values()].sort((x, y) => y.count - x.count || x.a.localeCompare(y.a)).slice(0, limit);
}

export interface ActivityDay {
  day: Day;
  answers: number;
  /** Яркость клетки 0–4. */
  level: number;
  future: boolean;
}

const levelOf = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : n < 60 ? 3 : 4);

/** День недели с понедельника: 0 — пн, 6 — вс. */
const weekday = (day: Day) => (daysBetween("2024-01-01", day) % 7 + 7) % 7; // 2024-01-01 — понедельник

/**
 * Календарь активности: `weeks` столбцов по 7 дней (пн–вс), последний столбец — текущая неделя.
 * Плюс сколько заданий сделано на этой неделе.
 */
export function activity(p: ProgressData, today: Day, weeks = 12): { columns: ActivityDay[][]; thisWeek: number } {
  const monday = addDays(today, -weekday(today));
  const start = addDays(monday, -7 * (weeks - 1));
  const columns: ActivityDay[][] = [];
  let thisWeek = 0;
  for (let w = 0; w < weeks; w++) {
    const col: ActivityDay[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      const answers = p.daily[day]?.answers ?? 0;
      const future = day > today;
      if (w === weeks - 1 && !future) thisWeek += answers;
      col.push({ day, answers, level: levelOf(answers), future });
    }
    columns.push(col);
  }
  return { columns, thisWeek };
}
