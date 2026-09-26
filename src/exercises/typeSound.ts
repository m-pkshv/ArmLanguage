import { checkLetterSound } from "../core/checking/answer";
import { t } from "../i18n";
import { byId, describe, effectsFor, pickForm, type Form } from "./helpers";
import type { ExerciseLogic } from "./types";

// E06: карточка с вводом — показана буква, пользователь набирает её звук русскими буквами.

export interface TypeSoundQuestion {
  letter: string;
  form: Form;
  handwriting: boolean;
  /** Клавиши упрощённой клавиатуры; null — полная клавиатура ЙЦУКЕН. */
  keys: string[] | null;
}

const RU = "абвгдежзийклмнопрстуфхцчшщъыьэюя".split("");

export const typeSound: ExerciseLogic<TypeSoundQuestion, string> = {
  id: "letter-type-sound",
  skills: ["recall"],
  isApplicable: () => true,
  generate(letter, ctx) {
    let keys: string[] | null = null;
    if (ctx.simpleKeyboard) {
      // буквы правильного ответа, «почти»-вариантов и звуков-ловушек + случайные до 10 клавиш
      const partners = letter.confusable.sound.map((id) => byId(ctx.content, id).sound.canonical);
      const needed = new Set([letter.sound.canonical, ...letter.sound.partial, ...partners].join("").split(""));
      for (const ch of ctx.rng.shuffle(RU)) {
        if (needed.size >= 10) break;
        if (!"ъь".includes(ch)) needed.add(ch);
      }
      keys = ctx.rng.shuffle([...needed]);
    }
    return { letter: letter.id, form: pickForm(ctx, letter), handwriting: ctx.script === "handwriting" && !!letter.handwriting, keys };
  },
  check(q, a, c) {
    const letter = byId(c.content, q.letter);
    const { verdict } = checkLetterSound(letter, a, c.strictness);
    const lines: string[] = [];
    if (verdict === "partial") lines.push(t("ex.partialSound", { answer: a, expected: letter.sound.canonical }));
    if (verdict === "wrong" && a.trim()) lines.push(t("ex.youTyped", { answer: a }));
    if (verdict !== "correct" && letter.notes[0]) lines.push(letter.notes[0]);
    return {
      verdict,
      effects: effectsFor(q.letter, "recall", verdict, q.handwriting),
      confusions: [],
      explanation: {
        title: t(verdict === "correct" ? "ex.correct" : verdict === "partial" ? "ex.almost" : "ex.rightAnswer", { what: describe(letter) }),
        lines,
      },
      letter: q.letter,
    };
  },
};
