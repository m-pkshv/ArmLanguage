import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { createEmptyProgress } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import { mixableLetters, mixText } from "../src/core/text/mixed";
import { EXERCISES } from "../src/exercises/logic";
import type { MixedQuestion } from "../src/exercises/mixedReading";
import type { ExerciseContext } from "../src/exercises/types";
import { planLesson } from "../src/session/plan";

const shown = (ru: string, known: string[]) =>
  mixText(ru, new Set(known), content)
    .map((s) => s.text)
    .join("");

describe("mixText", () => {
  it("replaces only known letters", () => {
    expect(shown("мама мыла раму", ["ayb", "men"])).toBe("մամա մылա рամу");
    expect(shown("мама мыла раму", [])).toBe("мама мыла раму");
  });

  it("uses the main letter of a sound pair and keeps case", () => {
    expect(shown("Тот", ["tyun", "tho", "o"])).toBe("Տօտ");
  });

  it("replaces дж and дз as one letter", () => {
    expect(shown("джинсы", ["je", "ini"])).toBe("ջիнсы");
    expect(shown("дзюдо", ["dza", "da"])).toBe("ձюդо");
  });

  it("leaves letters without an Armenian analogue", () => {
    expect(shown("щука ёж", content.letters.map((l) => l.id))).toMatch(/^щ.+ ё/);
  });
});

describe("mixed-reading exercise", () => {
  const ex = EXERCISES["mixed-reading"];
  const all = content.letters.map((l) => l.id);
  const ctx = (seed: number, known: string[], level = 0): ExerciseContext => ({
    content,
    rng: createRng(seed),
    known,
    focus: [],
    script: "print",
    level,
    simpleKeyboard: false,
  });

  it("builds readable questions for every main letter", () => {
    for (const id of mixableLetters(content)) {
      const letter = content.letters.find((l) => l.id === id)!;
      for (const [k, known] of [["a", all.slice(0, 12)], ["b", all]] as const) {
        const c = ctx(id.length * 7 + k.length, [...known, id]);
        if (!ex.isApplicable(letter, c)) continue;
        const q = ex.generate(letter, c) as MixedQuestion;
        expect(q.segments.some((s) => s.letter === id), id).toBe(true);
        expect(q.segments.map((s) => s.ru).join("")).toBe(q.answer);
        if (q.mode === "choice") {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(3);
          const wrong = q.options!.find((o) => o !== q.answer)!;
          expect(ex.check(q, { value: wrong, hinted: false }, { content, strictness: "soft" }).verdict).toBe("wrong");
        }
        expect(ex.check(q, { value: q.answer, hinted: false }, { content, strictness: "soft" }).verdict).toBe("correct");
        expect(ex.check(q, { value: q.answer.toUpperCase(), hinted: true }, { content, strictness: "soft" }).verdict).toBe("partial");
      }
    }
  });

  it("asks to type single words on a higher level", () => {
    const men = content.letters.find((l) => l.id === "men")!;
    const q = ex.generate(men, ctx(1, ["ayb", "men", "nu", "tyun", "se"], 3)) as MixedQuestion;
    if (q.source === "word") expect(q.mode).toBe("type");
  });

  it("each lesson ends with mixed reading on its new letters", () => {
    const p = createEmptyProgress(new Date());
    const s = planLesson(content, p, 0, 5, "2026-09-26");
    const last = s.steps.slice(-2);
    expect(last.every((st) => st.kind === "exercise" && st.types?.[0] === "mixed-reading")).toBe(true);
  });
});
