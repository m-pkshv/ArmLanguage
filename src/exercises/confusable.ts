import type { Letter, Word } from "../core/content/types";
import { indexLetters, readingOf, splitLetters, tokensOf } from "../core/text/armenian";
import { t } from "../i18n";
import { byId, describe, pairText } from "./helpers";
import type { ExerciseContext, ExerciseLogic } from "./types";

// E10: пары-ловушки (docs/03-exercises.md). Два варианта:
// - «написание»: картинка, чтение слова и два написания (տուն / թուն) — выбрать верное. Для букв,
//   похожих по звуку. Чтение под словом делает задание решаемым без знания слов;
// - «сетка»: 8 похожих по виду букв — отметить все нужные.

export interface SpellingQuestion {
  mode: "spelling";
  letter: string;
  partner: string;
  word: string;
  reading: string[];
  blank: number;
  /** Два написания; правильное — options[correct]. */
  options: [string, string];
  correct: 0 | 1;
}

export interface GridQuestion {
  mode: "grid";
  letter: string;
  partners: string[];
  /** Буквы в клетках (id); отметить нужно все клетки с letter. */
  cells: string[];
}

export type ConfusableQuestion = SpellingQuestion | GridQuestion;
/** Ответ: индекс выбранного написания или список отмеченных клеток. */
export type ConfusableAnswer = number | number[];

const soundPartners = (l: Letter, ctx: ExerciseContext) => l.confusable.sound.filter((id) => allowed(id, ctx));
const shapePartners = (l: Letter, ctx: ExerciseContext) => l.confusable.shape.filter((id) => allowed(id, ctx));

function allowed(id: string, ctx: ExerciseContext): boolean {
  if (ctx.pair) return ctx.pair.includes(id);
  return ctx.known.includes(id) || ctx.focus.includes(id);
}

const readAt = (l: Letter, first: boolean) => (first && l.sound.initial ? l.sound.initial.canonical : l.sound.canonical);

/**
 * Варианты «написания»: слово с буквой и «пара», которая на этом месте читалась бы иначе.
 * Если чтения совпадают (Խ/Հ — «х», Ո/Օ в середине слова — «о»), по подсказке-чтению правильное
 * написание не определить — такие варианты не берём.
 */
function spellingChoices(letter: Letter, ctx: ExerciseContext): { word: Word; partner: Letter }[] {
  const own = new Set(letter.words);
  const words = ctx.content.words
    .filter((w) => splitLetters(w.hy).includes(letter.lower))
    .sort((a, b) => Number(own.has(b.id)) - Number(own.has(a.id)) || Number(!!b.image) - Number(!!a.image));
  const out: { word: Word; partner: Letter }[] = [];
  for (const pid of soundPartners(letter, ctx)) {
    const partner = byId(ctx.content, pid);
    for (const word of words) {
      const first = splitLetters(word.hy)[0] === letter.lower;
      if (readAt(letter, first) !== readAt(partner, first)) out.push({ word, partner });
    }
  }
  return out;
}

export const confusablePair: ExerciseLogic<ConfusableQuestion, ConfusableAnswer> = {
  id: "confusable-pair",
  skills: ["discriminate"],
  isApplicable: (letter, ctx) => soundPartners(letter, ctx).length > 0 || shapePartners(letter, ctx).length > 0,
  generate(letter, ctx) {
    const choices = spellingChoices(letter, ctx);
    const shape = shapePartners(letter, ctx);
    const useSpelling = choices.length > 0 && (shape.length === 0 || ctx.rng.next() < 0.6);

    if (useSpelling) {
      // предпочитаем слова с картинкой и из примеров буквы (они в начале списка)
      const { word, partner } = ctx.rng.pick(choices.slice(0, Math.max(4, choices.filter((c) => c.word.image).length)));
      const tokens = tokensOf(word.hy);
      const blank = tokens.findIndex((tok) => tok.toLocaleLowerCase("hy") === letter.lower);
      const replacement = tokens[blank] === letter.lower ? partner.lower : partner.upper;
      const wrong = tokens.map((tok, i) => (i === blank ? replacement : tok)).join("");
      const correct = ctx.rng.int(2) as 0 | 1;
      const options: [string, string] = correct === 0 ? [word.hy, wrong] : [wrong, word.hy];
      return {
        mode: "spelling",
        letter: letter.id,
        partner: partner.id,
        word: word.id,
        reading: readingOf(tokens, indexLetters(ctx.content.letters)),
        blank,
        options,
        correct,
      };
    }

    // Сетка 8 клеток: 3–4 нужные буквы, остальные — похожие по виду (или по звуку, если похожих по виду нет)
    const partners = shape.length ? shape : soundPartners(letter, ctx);
    const targets = 3 + ctx.rng.int(2);
    const cells = [...Array(targets).fill(letter.id), ...[...Array(8 - targets)].map(() => ctx.rng.pick(partners))] as string[];
    return { mode: "grid", letter: letter.id, partners: [...new Set(partners)], cells: ctx.rng.shuffle(cells) };
  },
  check(q, a, c) {
    const target = byId(c.content, q.letter);
    if (q.mode === "spelling") {
      const partner = byId(c.content, q.partner);
      const word = c.content.words.find((w) => w.id === q.word)!;
      const ok = a === q.correct;
      const line = t("ex.wordLine", { hy: word.hy, pron: word.pronunciation, ru: word.ru });
      return {
        verdict: ok ? "correct" : "wrong",
        effects: [{ letter: q.letter, skill: "discriminate", verdict: ok ? "correct" : "wrong" }],
        confusions: ok ? [] : [[q.letter, q.partner]],
        explanation: {
          title: t(ok ? "ex.correct" : "ex.rightAnswer", { what: line }),
          lines: [t("ex.pairHint", { a: describe(target), b: describe(partner) })],
        },
        letter: q.letter,
      };
    }
    const picked = new Set(a as number[]);
    const need = q.cells.flatMap((id, i) => (id === q.letter ? [i] : []));
    const missed = need.filter((i) => !picked.has(i)).length;
    const extra = [...picked].filter((i) => q.cells[i] !== q.letter);
    const ok = missed === 0 && extra.length === 0;
    const lines: string[] = [];
    if (missed) lines.push(t("ex.gridMissed", { n: missed }));
    if (extra.length) lines.push(t("ex.gridExtra", { letters: [...new Set(extra.map((i) => pairText(byId(c.content, q.cells[i]!))))].join(", ") }));
    lines.push(q.partners.map((id) => describe(byId(c.content, id))).join("; "));
    return {
      verdict: ok ? "correct" : "wrong",
      effects: [{ letter: q.letter, skill: "discriminate", verdict: ok ? "correct" : "wrong" }],
      confusions: extra.length ? [[q.letter, q.cells[extra[0]!]!]] : [],
      explanation: { title: t(ok ? "ex.gridCorrect" : "ex.gridWrong", { what: pairText(target) }), lines },
      letter: q.letter,
    };
  },
};
