import type { Letter, RuWord } from "../core/content/types";
import { t } from "../i18n";
import { byId, describe, distractors, pairText } from "./helpers";
import type { ExerciseContext, ExerciseLogic } from "./types";

// E08: русское слово с пропуском → вставить армянскую букву с этим звуком (docs/03-exercises.md).

export interface RuInsertQuestion {
  letter: string;
  ruWord: string;
  /** Пропуск: позиция и длина в русском слове («дж» — 2 буквы). */
  pos: number;
  len: number;
  /** Все армянские буквы, подходящие по звуку (т → Տ и Թ): любая засчитывается. */
  accepted: string[];
  /** Варианты для выбора; null — ввод на армянской клавиатуре (keys). */
  options: string[] | null;
  keys: string[] | null;
}

interface Slot {
  word: RuWord;
  pos: number;
  len: number;
  accepted: string[];
}

function slots(letter: Letter, ctx: ExerciseContext): Slot[] {
  const out: Slot[] = [];
  const rules = Object.entries(ctx.content.ruHy).sort((a, b) => b[0].length - a[0].length); // «дж» раньше «д»
  for (const word of ctx.content.ruWords) {
    const s = word.ru;
    for (let i = 0; i < s.length; ) {
      const rule = rules.find(([ru]) => s.startsWith(ru, i));
      if (!rule) {
        i++;
        continue;
      }
      const [ru, ids] = rule;
      if (ids.includes(letter.id)) out.push({ word, pos: i, len: ru.length, accepted: ids });
      i += ru.length;
    }
  }
  return out;
}

export const ruWordInsert: ExerciseLogic<RuInsertQuestion, string> = {
  id: "ru-word-insert",
  skills: ["recall"],
  isApplicable: (letter, ctx) => slots(letter, ctx).length > 0,
  generate(letter, ctx) {
    const slot = ctx.rng.pick(slots(letter, ctx));
    const base = { letter: letter.id, ruWord: slot.word.id, pos: slot.pos, len: slot.len, accepted: slot.accepted };
    if (ctx.level >= 3) {
      // ввод на армянской клавиатуре: знакомые буквы + буквы занятия, по алфавиту
      const ids = new Set([...ctx.known, ...ctx.focus, letter.id]);
      const keys = ctx.content.letters.filter((l) => ids.has(l.id)).map((l) => l.id);
      return { ...base, options: null, keys };
    }
    const count = ctx.level >= 2 ? 5 : 3;
    const wrong = distractors(letter, ctx, count, { exclude: slot.accepted });
    return { ...base, options: ctx.rng.shuffle([letter.id, ...wrong.map((l) => l.id)]), keys: null };
  },
  check(q, a, c) {
    const target = byId(c.content, q.letter);
    const word = c.content.ruWords.find((w) => w.id === q.ruWord)!;
    const sound = word.ru.slice(q.pos, q.pos + q.len);
    const both = q.accepted.length > 1 ? [t("ex.bothFit", { sound, letters: q.accepted.map((id) => pairText(byId(c.content, id))).join(" / ") })] : [];
    if (q.accepted.includes(a)) {
      const chosen = byId(c.content, a);
      return {
        verdict: "correct",
        effects: [{ letter: q.letter, skill: "recall", verdict: "correct" }],
        confusions: [],
        explanation: { title: t("ex.correct", { what: t("ex.soundIs", { sound, what: describe(chosen) }) }), lines: both },
        letter: a,
      };
    }
    return {
      verdict: "wrong",
      effects: [{ letter: q.letter, skill: "recall", verdict: "wrong" }],
      confusions: [[q.letter, a]],
      explanation: {
        title: t("ex.rightAnswer", { what: t("ex.soundIs", { sound, what: describe(target) }) }),
        lines: [...both, t("ex.youChose", { what: describe(byId(c.content, a)) })],
      },
      letter: q.letter,
    };
  },
};
