import { checkWordReading, type LetterReading } from "../core/checking/word";
import type { Content, Letter, Word } from "../core/content/types";
import type { Effect } from "../core/progress/knowledge";
import type { Verdict } from "../core/progress/srs";
import { indexLetters, lettersOf, splitLetters } from "../core/text/armenian";
import { t } from "../i18n";
import { byId, pairText } from "./helpers";
import type { ExerciseContext, ExerciseLogic } from "./types";

// E07: прочитай слово (docs/03-exercises.md). Армянское слово из знакомых букв → набрать его чтение
// русскими буквами. Слов пользователь ещё не знает: проверяется чтение по буквам, ошибка показывается
// на конкретной букве. Нажатие на букву показывает её чтение — эта буква засчитывается как «почти».

export interface WordReadingQuestion {
  letter: string;
  word: string;
  /** Показать картинку и перевод до ответа (пока чтение ещё не уверенное). */
  hint: boolean;
}

export interface WordReadingAnswer {
  value: string;
  /** Номера букв слова, чьё чтение пользователь подсмотрел. */
  hinted: number[];
}

/** Разбор ответа по буквам — для показа после проверки. */
export interface WordReadingDetail {
  letters: LetterReading[];
  hinted: number[];
}

/** Слова, которые можно прочитать: все буквы знакомы и есть тренируемая буква. */
export function wordsToRead(c: Content, letterId: string, known: Iterable<string>): Word[] {
  const set = new Set(known);
  const index = indexLetters(c.letters);
  return c.words.filter((w) => {
    const ls = lettersOf(w.hy, index);
    return ls.every((l) => l && set.has(l.id)) && ls.some((l) => l!.id === letterId);
  });
}

/** Сначала короткие слова, потом длиннее (по уровню навыка «чтение»). */
const maxLength = (level: number) => (level <= 1 ? 4 : level <= 3 ? 6 : Infinity);

export const wordReading: ExerciseLogic<WordReadingQuestion, WordReadingAnswer> = {
  id: "word-type-reading",
  skills: ["read"],
  isApplicable: (letter, ctx) => wordsToRead(ctx.content, letter.id, [...ctx.known, ...ctx.focus, letter.id]).length > 0,
  generate(letter, ctx) {
    const all = wordsToRead(ctx.content, letter.id, [...ctx.known, ...ctx.focus, letter.id]);
    const hint = ctx.level < 3;
    const short = all.filter((w) => splitLetters(w.hy).length <= maxLength(ctx.level));
    let pool = short.length ? short : all;
    // с подсказкой лучше слова с картинкой
    if (hint && pool.some((w) => w.image)) pool = pool.filter((w) => w.image);
    return { letter: letter.id, word: ctx.rng.pick(pool).id, hint };
  },
  check(q, a, c) {
    const word = c.content.words.find((w) => w.id === q.word)!;
    const res = checkWordReading(word, a.value, c.content, c.strictness);
    const letters = res.letters.map((r, i) => (a.hinted.includes(i) && r.status === "ok" ? { ...r, status: "partial" as const } : r));
    let verdict = res.verdict;
    if (verdict === "correct" && letters.some((r) => r.status === "partial")) verdict = "partial";

    const lines: string[] = [];
    if (a.hinted.length && res.verdict === "correct") lines.push(t("ex.wordHinted"));
    // «Не знаю» — разбор по буквам виден в самом слове, построчные пояснения не нужны
    for (const r of a.value.trim() ? res.letters : []) {
      if (r.status === "wrong") lines.push(misreadLine(c.content, r));
      else if (r.status === "partial") lines.push(t("ex.wordPartial", { letter: r.token, given: r.given, expected: r.expected }));
    }
    if (res.schwaOmitted) lines.push(t("ex.wordSchwa", { pron: word.pronunciation }));
    if (res.exceptionByRule) lines.push(t("ex.wordException", { pron: word.pronunciation }));
    if (verdict === "wrong" && a.value.trim()) lines.unshift(t("ex.youTyped", { answer: a.value }));

    const what = t("ex.wordLine", { hy: word.hy, pron: word.pronunciation, ru: word.ru });
    return {
      verdict,
      effects: effectsOf(letters),
      confusions: confusionsOf(c.content, res.letters),
      explanation: { title: t(verdict === "correct" ? "ex.correct" : verdict === "partial" ? "ex.almost" : "ex.rightAnswer", { what }), lines },
      letter: res.letters.find((r) => r.status === "wrong")?.letter ?? q.letter,
      detail: { letters: res.letters, hinted: a.hinted } satisfies WordReadingDetail,
    };
  },
};

function misreadLine(c: Content, r: LetterReading): string {
  const what = pairText(byId(c, r.letter));
  return r.given ? t("ex.wordMisread", { letter: what, given: r.given, expected: r.expected }) : t("ex.wordSkipped", { letter: what, expected: r.expected });
}

/** Навык «чтение» — каждой букве слова: худший результат среди её вхождений. */
function effectsOf(letters: LetterReading[]): Effect[] {
  const rank: Record<Verdict, number> = { correct: 0, partial: 1, wrong: 2 };
  const toVerdict = (s: LetterReading["status"]): Verdict => (s === "ok" ? "correct" : s);
  const by = new Map<string, Verdict>();
  for (const r of letters) {
    const v = toVerdict(r.status);
    const prev = by.get(r.letter);
    if (!prev || rank[v] > rank[prev]) by.set(r.letter, v);
  }
  return [...by].map(([letter, verdict]) => ({ letter, skill: "read" as const, verdict }));
}

/** Путаница — если букву прочитали как похожую на неё (Թ → «т» в строгом режиме, ո → «с»). */
function confusionsOf(c: Content, letters: LetterReading[]): [string, string][] {
  const out: [string, string][] = [];
  for (const r of letters) {
    if (r.status !== "wrong" || !r.given) continue;
    const l = byId(c, r.letter);
    const other = [...l.confusable.sound, ...l.confusable.shape]
      .map((id) => byId(c, id))
      .find((o: Letter) => o.sound.canonical === r.given || o.sound.initial?.canonical === r.given);
    if (other) out.push([l.id, other.id]);
  }
  return out;
}
