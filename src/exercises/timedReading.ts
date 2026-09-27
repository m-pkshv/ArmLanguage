import type { Content, Letter, Word } from "../core/content/types";
import type { Effect } from "../core/progress/knowledge";
import { indexLetters, letterwise, readingOf, splitLetters, tokensOf } from "../core/text/armenian";
import { t } from "../i18n";
import { byId, describe } from "./helpers";
import type { ExerciseLogic } from "./types";

// Итоговый тест, часть 2: чтение незнакомых слов на время (docs/02-features.md, 2.5).
// Слово без картинки и перевода → выбрать чтение из трёх. Неправильные варианты — то же слово,
// где одна буква «прочитана» как похожая на неё. Время — от появления слова до выбора.

export interface TimedQuestion {
  letter: string;
  word: string;
  n: number;
  total: number;
  options: string[];
  /** Какая буква «прочитана неверно» в каждом варианте (null — верный). */
  misread: (string | null)[];
}

export interface TimedAnswer {
  value: string;
  ms: number;
}

/**
 * Слова для теста: от 3 букв, читаются по общим правилам и без непроизносимого «ы» —
 * тогда чтение по буквам совпадает с произношением, и все варианты выглядят одинаково «честно».
 */
export function readingTestWords(c: Content): Word[] {
  const index = indexLetters(c.letters);
  return c.words.filter((w) => !w.exception && splitLetters(w.hy).length >= 3 && letterwise(w.hy, index) === w.pronunciation);
}

/** Чтение буквы в данной позиции слова (в начале — своё: Ե → «йе»). */
const readingAt = (l: Letter, first: boolean) => (first && l.sound.initial ? l.sound.initial.canonical : l.sound.canonical);

function misreadings(word: Word, c: Content, rng: { shuffle<T>(a: T[]): T[] }): { text: string; letter: string }[] {
  const index = indexLetters(c.letters);
  const tokens = tokensOf(word.hy);
  const reading = readingOf(tokens, index);
  const answer = reading.join("");
  const out: { text: string; letter: string }[] = [];
  for (const i of rng.shuffle(tokens.map((_, k) => k))) {
    const l = index.get(tokens[i]!.toLocaleLowerCase("hy"))!;
    // сначала пары-ловушки буквы, потом любые буквы
    const partners = [...rng.shuffle([...l.confusable.sound, ...l.confusable.shape]), ...rng.shuffle(c.letters.map((x) => x.id))];
    for (const pid of partners) {
      const alt = readingAt(byId(c, pid), i === 0);
      if (alt === reading[i]) continue;
      const text = reading.map((r, k) => (k === i ? alt : r)).join("");
      if (text !== answer && !out.some((o) => o.text === text)) {
        out.push({ text, letter: l.id });
        break;
      }
    }
    if (out.length >= 2) break;
  }
  return out;
}

export const timedReading: ExerciseLogic<TimedQuestion, TimedAnswer> = {
  id: "timed-reading",
  skills: ["read"],
  isApplicable: (_letter, ctx) => !!ctx.reading,
  generate(letter, ctx) {
    const r = ctx.reading!;
    const word = ctx.content.words.find((w) => w.id === r.word)!;
    const wrong = misreadings(word, ctx.content, ctx.rng);
    const opts = ctx.rng.shuffle([{ text: word.pronunciation, letter: null as string | null }, ...wrong]);
    return { letter: letter.id, word: word.id, n: r.n, total: r.total, options: opts.map((o) => o.text), misread: opts.map((o) => o.letter) };
  },
  check(q, a, c) {
    const word = c.content.words.find((w) => w.id === q.word)!;
    const ok = a.value === word.pronunciation;
    const misread = ok ? null : (q.misread[q.options.indexOf(a.value)] ?? null);
    const letters = [...new Set(splitLetters(word.hy).map((lower) => c.content.letters.find((l) => l.lower === lower)!.id))];
    const effects: Effect[] = ok
      ? letters.map((letter) => ({ letter, skill: "read" as const, verdict: "correct" as const }))
      : [{ letter: misread ?? q.letter, skill: "read", verdict: "wrong" }];
    const what = t("ex.wordLine", { hy: word.hy, pron: word.pronunciation, ru: word.ru });
    const secs = t("ex.timedSeconds", { s: (a.ms / 1000).toFixed(1).replace(".", ",") });
    return {
      verdict: ok ? "correct" : "wrong",
      effects,
      confusions: [],
      explanation: {
        title: `${t(ok ? "ex.correct" : "ex.rightAnswer", { what })}`,
        lines: [secs, ...(misread ? [t("ex.mixedMisread", { what: describe(byId(c.content, misread)) })] : [])],
      },
      letter: misread ?? q.letter,
      timing: { ok, ms: a.ms },
    };
  },
};
