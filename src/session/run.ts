import type { Verdict } from "../core/progress/srs";
import type { SavedSession, Step } from "../core/session/types";

// Ход занятия: учёт ответов и возврат заданий с ошибкой ближе к концу (docs/02-features.md, 2.4).

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
export function recordAnswer(s: SavedSession, verdict: Verdict, letter: string): void {
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
