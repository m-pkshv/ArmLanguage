import type { Day } from "../dates";
import { review, type Verdict } from "./srs";
import type { ItemProgress, ProgressData, Skill } from "./types";

// Знание букв: чтение и обновление прогресса по навыкам (docs/03-exercises.md, «Навыки»).

export const MAIN_SKILLS: Skill[] = ["recognize", "recall"];
/** Буква выучена, когда основные навыки — в коробке ≥ 3 (docs/02-features.md, 2.5). */
export const LEARNED_BOX = 3;

export const itemKey = (letterId: string, skill: Skill): string => `letter:${letterId}#${skill}`;

export function itemOf(p: ProgressData, letterId: string, skill: Skill): ItemProgress | undefined {
  return p.items[itemKey(letterId, skill)];
}

export function boxOf(p: ProgressData, letterId: string, skill: Skill): number {
  return itemOf(p, letterId, skill)?.box ?? 0;
}

/** Встречалась ли буква пользователю в заданиях. */
export function isSeen(p: ProgressData, letterId: string): boolean {
  return MAIN_SKILLS.some((s) => itemOf(p, letterId, s));
}

export function isLearned(p: ProgressData, letterId: string): boolean {
  return MAIN_SKILLS.every((s) => boxOf(p, letterId, s) >= LEARNED_BOX);
}

export type LetterState = "new" | "learning" | "learned";

export function letterState(p: ProgressData, letterId: string): LetterState {
  if (isLearned(p, letterId)) return "learned";
  return isSeen(p, letterId) ? "learning" : "new";
}

/** Буквы, которые пора повторить: хотя бы один основной навык с наступившим сроком. Самые «просроченные» — первыми. */
export function dueLetters(p: ProgressData, today: Day, letterIds: string[]): string[] {
  const due: { id: string; due: string; box: number }[] = [];
  for (const id of letterIds) {
    const items = MAIN_SKILLS.map((s) => itemOf(p, id, s)).filter((i): i is ItemProgress => !!i && i.due <= today);
    if (!items.length) continue;
    due.push({ id, due: items.map((i) => i.due).sort()[0]!, box: Math.min(...items.map((i) => i.box)) });
  }
  return due.sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box).map((d) => d.id);
}

export interface Effect {
  letter: string;
  skill: Skill;
  verdict: Verdict;
}

/** Применяет результат ответа к прогрессу (изменяет объект). */
export function applyAnswer(
  p: ProgressData,
  answer: { effects: Effect[]; verdict: Verdict; confusions: [expected: string, given: string][]; record?: { game: string; ms: number } },
  today: Day,
): void {
  // Рекорд мини-игры «Найди пары» — если лучше прежнего
  if (answer.record) {
    const prev = p.games[answer.record.game];
    if (!prev || answer.record.ms < prev.bestMs) p.games[answer.record.game] = { bestMs: answer.record.ms, at: today };
  }
  for (const e of answer.effects) {
    const key = itemKey(e.letter, e.skill);
    p.items[key] = review(p.items[key], e.verdict, today);
  }
  const d = (p.daily[today] ??= { answers: 0, correct: 0 });
  d.answers++;
  if (answer.verdict === "correct") d.correct++;
  for (const [expected, given] of answer.confusions) {
    const key = `letter:${expected}>letter:${given}`;
    p.confusions[key] = (p.confusions[key] ?? 0) + 1;
  }
}

/** Отметить буквы как «к повторению сегодня», если их ещё не было (урок открыт кнопкой «Я знаю эти буквы»). */
export function scheduleForReview(p: ProgressData, letterIds: string[], today: Day): void {
  for (const id of letterIds) {
    for (const s of MAIN_SKILLS) {
      const key = itemKey(id, s);
      p.items[key] ??= { box: 0, due: today, ok: 0, bad: 0, last: today };
    }
  }
}
