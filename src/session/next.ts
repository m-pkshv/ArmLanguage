import { alphabetLessons, knownLetters, nextLessonIndex } from "../core/course";
import type { Content } from "../core/content/types";
import type { Day } from "../core/dates";
import { dueLetters } from "../core/progress/knowledge";
import type { ProgressData } from "../core/progress/types";
import { dueStudyItems, firstWordsOpen, themeDone, themes } from "../core/words";
import { exerciseCount, exercisesDone } from "./run";

// Что делает кнопка «Продолжить» на главном экране (docs/09-navigation.md, 9.4).

export type NextAction =
  | { kind: "resume"; done: number; total: number; lesson: boolean }
  | { kind: "review"; count: number }
  | { kind: "lesson"; index: number }
  | { kind: "final" }
  | { kind: "theme-lesson"; themeId: string; index: number }
  | { kind: "theme-test"; themeId: string }
  | { kind: "practice" };

/** С какого числа букв и слов к повторению сначала повторяем, а потом даём новый урок. */
export const REVIEW_FIRST = 10;

export function nextAction(p: ProgressData, c: Content, today: Day): NextAction {
  const s = p.session;
  if (s && (s.kind === "lesson" || s.kind === "review" || s.kind === "theme-lesson")) {
    return { kind: "resume", done: exercisesDone(s), total: exerciseCount(s), lesson: s.kind !== "review" };
  }
  // к повторению — буквы и слова вместе (общее повторение, docs/10-first-words.md, 10.6)
  const due = dueLetters(p, today, knownLetters(p, c)).length + dueStudyItems(c, p, today).length;
  if (due >= REVIEW_FIRST) return { kind: "review", count: due };
  const lesson = nextLessonIndex(p, alphabetLessons(c));
  if (lesson !== undefined) return { kind: "lesson", index: lesson };
  // Итоговый тест алфавита кнопка предлагает, пока его ни разу не проходили; не сдан — идём к словам,
  // пересдать можно на карте уроков (решение владельца, 2026-09-28).
  if (!p.finalTest) return { kind: "final" };
  const words = nextWordsStep(p, c);
  if (words) return words;
  if (due > 0) return { kind: "review", count: due };
  return { kind: "practice" };
}

/**
 * Следующий шаг в «Первых словах»: следующий урок первой незаконченной темы или её итоговое задание.
 * Итоговое задание предлагается, пока его ни разу не проходили; не сдано — переходим к следующей теме
 * (пересдать можно на экране темы).
 */
export function nextWordsStep(p: ProgressData, c: Content): Extract<NextAction, { kind: "theme-lesson" | "theme-test" }> | undefined {
  if (!firstWordsOpen(p, c)) return undefined;
  for (const theme of themes(c)) {
    if (theme.status !== "available" || !theme.lessons.length) continue;
    if (!themeDone(p, theme)) return { kind: "theme-lesson", themeId: theme.id, index: theme.lessons.findIndex((l) => !p.lessons[l.id]) };
    if (!p.themeTests[theme.id]) return { kind: "theme-test", themeId: theme.id };
  }
  return undefined;
}

/** Первый запуск: ещё ничего не начато. */
export const isFirstRun = (p: ProgressData): boolean => !p.session && !Object.keys(p.lessons).length && !Object.keys(p.items).length;
