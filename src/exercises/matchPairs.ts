import { soundLabel } from "../core/checking/answer";
import type { Content, Letter } from "../core/content/types";
import type { Effect } from "../core/progress/knowledge";
import type { Skill } from "../core/progress/types";
import type { MatchKind } from "../core/session/types";
import { t } from "../i18n";
import { byId, describe } from "./helpers";
import type { ExerciseContext, ExerciseLogic } from "./types";

// E05: мини-игра «Найди пары» (docs/03-exercises.md). Поле из 5 пар: слева буквы, справа их звуки
// (или строчные, или рукописные). Нажать карточку слева и её пару справа; ошибка сбрасывает выбор.
// Засчитывается по каждой букве: нашли с первого раза — верно, была ошибка — неверно.

export interface MatchQuestion {
  kind: MatchKind;
  /** Буквы поля в порядке левой колонки и в порядке правой. */
  left: string[];
  right: string[];
}

export interface MatchAnswer {
  ms: number;
  /** Ошибочные пары: [буква левой карточки, буква правой карточки]. */
  mistakes: [string, string][];
}

export const MATCH_SIZE = 5;
const MIN_SIZE = 3;

const SKILL: Record<MatchKind, Skill> = { sound: "recognize", case: "case", handwriting: "handwriting" };

/** Подходит ли буква для вида пар: у և нет заглавной, рукописная форма есть не у всех. */
function fits(l: Letter, kind: MatchKind): boolean {
  if (kind === "case") return l.upper !== l.lower && l.id !== "yev";
  if (kind === "handwriting") return !!l.handwriting?.lower;
  return true;
}

/** Чтения буквы: на одном поле не должно быть двух букв с одинаковым звуком (Ո и Օ — «о»). */
const readings = (l: Letter) => [l.sound.canonical, ...(l.sound.initial ? [l.sound.initial.canonical] : [])];

/** Буквы для поля: тренируемая буква + другие из группы (или знакомые), без совпадающих звуков. */
export function matchLetters(letter: Letter, ctx: Pick<ExerciseContext, "content" | "rng" | "known" | "focus" | "group" | "match">): string[] {
  const kind = ctx.match ?? "sound";
  const pool = ctx.group ?? [...new Set([...ctx.focus, ...ctx.known])];
  const out: Letter[] = [];
  const taken = new Set<string>();
  for (const id of [letter.id, ...ctx.rng.shuffle(pool.filter((id) => id !== letter.id))]) {
    if (out.length >= MATCH_SIZE) break;
    const l = byId(ctx.content, id);
    if (!fits(l, kind) || readings(l).some((r) => taken.has(r))) continue;
    out.push(l);
    readings(l).forEach((r) => taken.add(r));
  }
  return out.map((l) => l.id);
}

/** Что написано на правой карточке. */
export const rightLabel = (l: Letter, kind: MatchKind): string => (kind === "sound" ? soundLabel(l) : l.lower);

/** «0:14» */
export const formatTime = (ms: number): string => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const matchPairs: ExerciseLogic<MatchQuestion, MatchAnswer> = {
  id: "match-pairs",
  skills: ["recognize"],
  isApplicable: (letter, ctx) => fits(letter, ctx.match ?? "sound") && matchLetters(letter, ctx).length >= MIN_SIZE,
  generate(letter, ctx) {
    const letters = matchLetters(letter, ctx);
    const left = ctx.rng.shuffle(letters);
    // Ни одна пара не стоит напротив друг друга — иначе поле решается «по строчкам»
    let right = ctx.rng.shuffle(letters);
    for (let i = 0; i < 50 && right.some((id, k) => id === left[k]); i++) right = ctx.rng.shuffle(letters);
    return { kind: ctx.match ?? "sound", left, right };
  },
  check(q, a, c) {
    const missed = new Set(a.mistakes.map(([l]) => l));
    const effects: Effect[] = q.left.map((letter) => ({ letter, skill: SKILL[q.kind], verdict: missed.has(letter) ? "wrong" : "correct" }));
    const confusions = a.mistakes.filter(([l, r]) => isPartner(c.content, l, r)) as [string, string][];
    const time = formatTime(a.ms);
    const title = a.mistakes.length ? t("ex.matchErrors", { time, n: a.mistakes.length }) : t("ex.matchDone", { time });
    return {
      // Ошибки уже засчитаны буквам; раунд целиком не повторяем, поэтому не «неверно», а «почти»
      verdict: a.mistakes.length ? "partial" : "correct",
      effects,
      confusions,
      explanation: { title, lines: [...missed].map((id) => t("ex.matchRemember", { what: describe(byId(c.content, id)) })) },
      letter: [...missed][0] ?? q.left[0]!,
      record: a.mistakes.length ? undefined : { game: q.kind, ms: a.ms },
    };
  },
};

function isPartner(c: Content, a: string, b: string): boolean {
  const l = byId(c, a);
  return [...l.confusable.sound, ...l.confusable.shape].includes(b);
}
