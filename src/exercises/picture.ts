import { soundLabel } from "../core/checking/answer";
import type { Letter, Word } from "../core/content/types";
import { splitLetters } from "../core/text/armenian";
import { t } from "../i18n";
import { byId, describe, distractors, withOptions } from "./helpers";
import type { ExerciseContext, ExerciseLogic } from "./types";

// E04: картинка + армянское слово с пропуском на месте изучаемой буквы → выбрать букву.

export interface PictureQuestion {
  letter: string;
  word: string;
  /** Слово по буквам; пропуск — на позиции blank. */
  tokens: string[];
  blank: number;
  /** Пропуск в начале слова, которое пишется с заглавной (Հայաստան) — варианты показываем заглавными. */
  upper: boolean;
  options: string[];
}

function candidates(letter: Letter, ctx: ExerciseContext): Word[] {
  const withLetter = (w: Word) => !!w.image && splitLetters(w.hy).includes(letter.lower);
  const own = letter.words.map((id) => ctx.content.words.find((w) => w.id === id)).filter((w): w is Word => !!w && withLetter(w));
  return own.length ? own : ctx.content.words.filter(withLetter);
}

/** Слово буква за буквой, но с исходным регистром. */
function tokensOf(hy: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < hy.length; ) {
    const two = hy.slice(i, i + 2);
    const tok = two.toLocaleLowerCase("hy") === "ու" ? two : hy[i]!;
    out.push(tok);
    i += tok.length;
  }
  return out;
}

export const pictureToLetter: ExerciseLogic<PictureQuestion, string> = {
  id: "picture-to-letter",
  skills: ["recognize"],
  isApplicable: (letter, ctx) => candidates(letter, ctx).length > 0,
  generate(letter, ctx) {
    const word = ctx.rng.pick(candidates(letter, ctx));
    const tokens = tokensOf(word.hy);
    const blank = tokens.findIndex((tok) => tok.toLocaleLowerCase("hy") === letter.lower);
    const wrong = distractors(letter, ctx, 3, { distinct: soundLabel, exclude: ["yev"] });
    return {
      letter: letter.id,
      word: word.id,
      tokens,
      blank,
      upper: tokens[blank] !== letter.lower,
      options: withOptions(letter, wrong, ctx),
    };
  },
  check(q, a, c) {
    const target = byId(c.content, q.letter);
    const word = c.content.words.find((w) => w.id === q.word)!;
    const wordLine = t("ex.wordLine", { hy: word.hy, pron: word.pronunciation, ru: word.ru });
    if (a === q.letter) {
      return {
        verdict: "correct",
        effects: [{ letter: q.letter, skill: "recognize", verdict: "correct" }],
        confusions: [],
        explanation: { title: t("ex.correct", { what: wordLine }), lines: [] },
        letter: q.letter,
      };
    }
    return {
      verdict: "wrong",
      effects: [{ letter: q.letter, skill: "recognize", verdict: "wrong" }],
      confusions: [[q.letter, a]],
      explanation: {
        title: t("ex.rightAnswer", { what: wordLine }),
        lines: [t("ex.missing", { what: describe(target) }), t("ex.youChose", { what: describe(byId(c.content, a)) })],
      },
      letter: q.letter,
    };
  },
};
