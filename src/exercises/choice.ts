import { soundLabel } from "../core/checking/answer";
import type { Letter } from "../core/content/types";
import { t } from "../i18n";
import { byId, describe, distractors, effectsFor, pickForm, withOptions, type Form } from "./helpers";
import type { CheckResult, ExerciseLogic } from "./types";

// Задания с выбором из 4 вариантов: E02 буква → звук, E03 звук → буква, E15 заглавная ↔ строчная.

export interface LetterChoiceQuestion {
  letter: string;
  form: Form;
  options: string[]; // id букв
  handwriting: boolean;
}

function choiceResult(q: LetterChoiceQuestion, answer: string, skill: "recognize" | "case", c: Parameters<ExerciseLogic["check"]>[2]): CheckResult {
  const target = byId(c.content, q.letter);
  if (answer === q.letter) {
    return {
      verdict: "correct",
      effects: effectsFor(q.letter, skill, "correct", q.handwriting),
      confusions: [],
      explanation: { title: t("ex.correct", { what: describe(target) }), lines: [] },
      letter: q.letter,
    };
  }
  const given = byId(c.content, answer);
  return {
    verdict: "wrong",
    effects: effectsFor(q.letter, skill, "wrong", q.handwriting),
    confusions: [[q.letter, answer]],
    explanation: {
      title: t("ex.rightAnswer", { what: describe(target) }),
      lines: [t("ex.youChose", { what: describe(given) })],
    },
    letter: q.letter,
  };
}

/** E02: показана буква → выбрать её звук. */
export const letterToSound: ExerciseLogic<LetterChoiceQuestion, string> = {
  id: "letter-to-sound",
  skills: ["recognize"],
  isApplicable: () => true,
  generate(letter, ctx) {
    const wrong = distractors(letter, ctx, 3, { by: "sound", distinct: soundLabel });
    return { letter: letter.id, form: pickForm(ctx, letter), options: withOptions(letter, wrong, ctx), handwriting: ctx.script === "handwriting" && !!letter.handwriting };
  },
  check: (q, a, c) => choiceResult(q, a, "recognize", c),
};

/** E03: показан звук → выбрать букву. */
export const soundToLetter: ExerciseLogic<LetterChoiceQuestion, string> = {
  id: "sound-to-letter",
  skills: ["recognize"],
  isApplicable: () => true,
  generate(letter, ctx) {
    const wrong = distractors(letter, ctx, 3, { distinct: soundLabel });
    return { letter: letter.id, form: "pair", options: withOptions(letter, wrong, ctx), handwriting: ctx.script === "handwriting" && !!letter.handwriting };
  },
  check: (q, a, c) => choiceResult(q, a, "recognize", c),
};

export interface CaseQuestion extends LetterChoiceQuestion {
  /** Какая форма показана в вопросе; варианты — в другой форме. */
  from: "upper" | "lower";
}

const hasCasePair = (l: Letter) => l.upper !== l.lower && l.id !== "yev";

/** E15: заглавная ↔ строчная. */
export const caseMatch: ExerciseLogic<CaseQuestion, string> = {
  id: "case-match",
  skills: ["case"],
  isApplicable: hasCasePair,
  generate(letter, ctx) {
    const wrong = distractors(letter, ctx, 3, { by: "shape", exclude: ["yev"] });
    return {
      letter: letter.id,
      form: "pair",
      from: ctx.rng.pick(["upper", "lower"] as const),
      options: withOptions(letter, wrong, ctx),
      handwriting: ctx.script === "handwriting" && !!letter.handwriting,
    };
  },
  check: (q, a, c) => choiceResult(q, a, "case", c),
};
