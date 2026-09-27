import type { Verdict } from "../core/progress/srs";
import type { SavedSession, Step } from "../core/session/types";

// Ход занятия: учёт ответов и возврат заданий с ошибкой ближе к концу (docs/02-features.md, 2.4).
// Итоговый тест сдан (docs/02-features.md, 2.5): задания от 90% и, если была часть 2, чтение 20 слов —
// верно от 18, в среднем не дольше 5 секунд на слово.

const MAX_RETRIES = 6;
const RETRY_GAP = 4;

export const currentStep = (s: SavedSession): Step | undefined => s.steps[s.index];
export const isFinished = (s: SavedSession): boolean => s.index >= s.steps.length;

/** Число заданий (без экранов знакомства) — для полоски прогресса и итогов. */
export const exerciseCount = (s: SavedSession): number => s.steps.filter((st) => st.kind === "exercise").length;
export const exercisesDone = (s: SavedSession): number => s.steps.slice(0, s.index).filter((st) => st.kind === "exercise").length;

/** Переход дальше после экрана знакомства. */
export function skipIntro(s: SavedSession): void {
  s.index++;
}

/** Учитывает ответ на текущее задание и переходит к следующему шагу (изменяет объект). */
export function recordAnswer(s: SavedSession, verdict: Verdict, letter: string, timing?: { ok: boolean; ms: number }): void {
  // Чтение на время (итоговый тест, часть 2) считается отдельно и не повторяется
  if (timing) {
    const rd = (s.reading ??= { correct: 0, total: 0, ms: 0 });
    rd.total++;
    rd.ms += timing.ms;
    if (timing.ok) rd.correct++;
    s.index++;
    return;
  }
  const r = s.result;
  r[verdict]++;
  if (verdict === "wrong") {
    r.wrongByLetter[letter] = (r.wrongByLetter[letter] ?? 0) + 1;
    const retries = s.steps.filter((st) => st.kind === "exercise" && st.retry).length;
    if (s.options.retries !== false && retries < MAX_RETRIES) {
      const at = Math.min(s.index + 1 + RETRY_GAP, s.steps.length);
      s.steps.splice(at, 0, { kind: "exercise", letter, retry: true });
    }
  }
  s.index++;
}

/** Доля верных ответов («почти» — половина). */
export function score(s: SavedSession): number {
  const { correct, partial, wrong } = s.result;
  const total = correct + partial + wrong;
  return total ? (correct + partial / 2) / total : 0;
}

export const FINAL_PASS = 0.9;
export const READING_WORDS = 20;
export const READING_MIN_CORRECT = 18;
export const READING_MAX_AVG_MS = 5000;

/** Итог чтения на время: верно, всего, среднее время на слово (null — части 2 не было). */
export function readingResult(s: SavedSession): { correct: number; total: number; avgMs: number; passed: boolean } | null {
  const r = s.reading;
  if (!r || !r.total) return null;
  const avgMs = r.ms / r.total;
  return { correct: r.correct, total: r.total, avgMs, passed: r.correct >= READING_MIN_CORRECT && avgMs <= READING_MAX_AVG_MS };
}

/** Сдан ли итоговый тест. Старые незаконченные тесты без части 2 оцениваются только по заданиям. */
export function finalPassed(s: SavedSession): boolean {
  const reading = readingResult(s);
  return score(s) >= FINAL_PASS && (!s.steps.some((st) => st.kind === "exercise" && st.reading) || !!reading?.passed);
}
