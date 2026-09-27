import { alphabetLessons, knownLetters, nextLessonIndex } from "../core/course";
import type { Content } from "../core/content/types";
import type { Day } from "../core/dates";
import { dueLetters } from "../core/progress/knowledge";
import type { ProgressData } from "../core/progress/types";
import { exerciseCount, exercisesDone } from "./run";

// Что делает кнопка «Продолжить» на главном экране (docs/09-navigation.md, 9.4).

export type NextAction =
  | { kind: "resume"; done: number; total: number; lesson: boolean }
  | { kind: "review"; count: number }
  | { kind: "lesson"; index: number }
  | { kind: "final" }
  | { kind: "practice" };

/** С какого числа букв к повторению сначала повторяем, а потом даём новый урок. */
export const REVIEW_FIRST = 10;

export function nextAction(p: ProgressData, c: Content, today: Day): NextAction {
  const s = p.session;
  if (s && (s.kind === "lesson" || s.kind === "review" || s.kind === "theme-lesson")) {
    return { kind: "resume", done: exercisesDone(s), total: exerciseCount(s), lesson: s.kind !== "review" };
  }
  const due = dueLetters(p, today, knownLetters(p, c)).length;
  if (due >= REVIEW_FIRST) return { kind: "review", count: due };
  const lesson = nextLessonIndex(p, alphabetLessons(c));
  if (lesson !== undefined) return { kind: "lesson", index: lesson };
  if (!p.finalTest?.passedAt) return { kind: "final" };
  if (due > 0) return { kind: "review", count: due };
  return { kind: "practice" };
}

/** Первый запуск: ещё ничего не начато. */
export const isFirstRun = (p: ProgressData): boolean => !p.session && !Object.keys(p.lessons).length && !Object.keys(p.items).length;
