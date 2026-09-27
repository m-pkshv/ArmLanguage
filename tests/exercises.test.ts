import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { alphabetLessons } from "../src/core/course";
import { createEmptyProgress } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import type { ExerciseId } from "../src/core/session/types";
import { EXERCISES } from "../src/exercises/logic";
import type { ExerciseContext } from "../src/exercises/types";
import { planFinalTest, planLesson, planPairs, planReview } from "../src/session/plan";
import { recordAnswer, score } from "../src/session/run";
import { chooseExercise } from "../src/session/select";

const TODAY = "2026-09-26";
const all = content.letters.map((l) => l.id);
const ctx = (seed: number, level = 0, over: Partial<ExerciseContext> = {}): ExerciseContext => ({
  content,
  rng: createRng(seed),
  known: all,
  focus: ["ayb", "men", "nu", "tyun", "se"],
  script: "print",
  level,
  simpleKeyboard: false,
  ...over,
});
const checkCtx = { content, strictness: "soft" as const };

describe("exercise logic", () => {
  for (const [id, ex] of Object.entries(EXERCISES)) {
    // у этих заданий ответ — не буква (номер варианта, клетки, текст прочтения); они проверяются отдельно
    if (id === "confusable-pair" || id === "mixed-reading" || id === "word-type-reading" || id === "match-pairs" || id === "timed-reading") continue;
    it(`${id}: every applicable letter gets a valid question`, () => {
      let applicable = 0;
      for (const [i, letter] of content.letters.entries()) {
        for (const level of [0, 2, 3]) {
          const c = ctx(i * 10 + level, level);
          if (!ex.isApplicable(letter, c)) continue;
          applicable++;
          const q = ex.generate(letter, c);
          const options: string[] | null = q.options ?? null;
          if (options) {
            expect(options).toContain(letter.id);
            expect(new Set(options).size).toBe(options.length);
            expect(options.length).toBeGreaterThanOrEqual(4);
          }
          const right = id === "letter-type-sound" ? letter.sound.canonical : letter.id;
          const ok = ex.check(q, right, checkCtx);
          expect(ok.verdict, `${id} ${letter.id}`).toBe("correct");
          expect(ok.effects[0]).toMatchObject({ letter: letter.id, verdict: "correct" });
          const choices: string[] | null = options ?? q.keys ?? null;
          const wrongAnswer = choices ? choices.find((o) => o !== letter.id && !(q.accepted ?? []).includes(o))! : "щ";
          const bad = ex.check(q, wrongAnswer, checkCtx);
          expect(bad.verdict).toBe("wrong");
          expect(bad.explanation.title).toContain("Правильно");
        }
      }
      expect(applicable).toBeGreaterThan(0);
    });
  }

  it("picture-to-letter shows the reading and never offers a same-sounding letter", () => {
    for (const [i, letter] of content.letters.entries()) {
      const c = ctx(i);
      if (!EXERCISES["picture-to-letter"].isApplicable(letter, c)) continue;
      const q = EXERCISES["picture-to-letter"].generate(letter, c);
      expect(q.reading).toHaveLength(q.tokens.length);
      const sound = q.reading[q.blank];
      for (const id of q.options) {
        if (id === letter.id) continue;
        const o = content.letters.find((l) => l.id === id)!;
        expect([o.sound.canonical, o.sound.initial?.canonical], `${letter.id}: ${id}`).not.toContain(sound);
      }
    }
  });

  it("confusable-pair: spelling differs only in the letter and is decidable by the reading", () => {
    const ex = EXERCISES["confusable-pair"];
    let spelling = 0;
    let grid = 0;
    for (const [i, letter] of content.letters.entries()) {
      for (let k = 0; k < 6; k++) {
        const c = ctx(i * 100 + k);
        if (!ex.isApplicable(letter, c)) continue;
        const q = ex.generate(letter, c);
        if (q.mode === "spelling") {
          spelling++;
          const [a, b] = q.options;
          expect(a).not.toBe(b);
          expect(a.length).toBe(b.length);
          const partner = content.letters.find((l) => l.id === q.partner)!;
          const first = q.blank === 0;
          const read = (l: typeof letter) => (first && l.sound.initial ? l.sound.initial.canonical : l.sound.canonical);
          expect(read(partner), `${letter.id}/${partner.id}`).not.toBe(read(letter));
          expect(ex.check(q, q.correct, checkCtx).verdict).toBe("correct");
          const bad = ex.check(q, 1 - q.correct, checkCtx);
          expect(bad.verdict).toBe("wrong");
          expect(bad.confusions).toEqual([[letter.id, q.partner]]);
        } else {
          grid++;
          expect(q.cells).toHaveLength(8);
          const need = q.cells.flatMap((c2: string, j: number) => (c2 === letter.id ? [j] : []));
          expect(need.length).toBeGreaterThanOrEqual(3);
          expect(ex.check(q, need, checkCtx).verdict).toBe("correct");
          expect(ex.check(q, need.slice(1), checkCtx).verdict).toBe("wrong");
        }
      }
    }
    expect(spelling).toBeGreaterThan(0);
    expect(grid).toBeGreaterThan(0);
  });

  it("confusable-pair in the trainer compares only with the chosen pair", () => {
    const tyun = content.letters.find((l) => l.id === "tyun")!;
    for (let k = 0; k < 10; k++) {
      const q = EXERCISES["confusable-pair"].generate(tyun, ctx(k, 0, { pair: ["tho"] }));
      if (q.mode === "spelling") expect(q.partner).toBe("tho");
      else expect(q.partners).toEqual(["tho"]);
    }
  });

  it("letter-to-sound puts the sound partner among options", () => {
    const tho = content.letters.find((l) => l.id === "tho")!;
    const q = EXERCISES["letter-to-sound"].generate(tho, ctx(1));
    expect(q.options).toContain("tyun");
  });

  it("ru-word-insert accepts either letter of a sound pair", () => {
    const tyun = content.letters.find((l) => l.id === "tyun")!;
    const q = EXERCISES["ru-word-insert"].generate(tyun, ctx(3));
    expect(q.accepted).toEqual(["tyun", "tho"]);
    expect(EXERCISES["ru-word-insert"].check(q, "tho", checkCtx).verdict).toBe("correct");
  });

  it("ru-word-insert switches to the Armenian keyboard on high level", () => {
    const sha = content.letters.find((l) => l.id === "sha")!;
    const q = EXERCISES["ru-word-insert"].generate(sha, ctx(4, 3));
    expect(q.options).toBeNull();
    expect(q.keys).toContain("sha");
  });

  it("simple keyboard contains the letters of the answer", () => {
    const tho = content.letters.find((l) => l.id === "tho")!;
    const q = EXERCISES["letter-type-sound"].generate(tho, ctx(5, 0, { simpleKeyboard: true }));
    expect(q.keys).toEqual(expect.arrayContaining(["т", "х"]));
  });
});

describe("session plans", () => {
  const p = createEmptyProgress(new Date());

  it("lessons introduce every new letter once and have 15–35 exercises", () => {
    alphabetLessons(content).forEach((lesson, i) => {
      const s = planLesson(content, p, i, 100 + i, TODAY);
      const intros = s.steps.filter((st) => st.kind === "intro").map((st) => `letter:${st.letter}`);
      expect(intros).toEqual(lesson.newItems);
      const n = s.steps.filter((st) => st.kind === "exercise").length;
      expect(n).toBeGreaterThanOrEqual(15);
      expect(n).toBeLessThanOrEqual(35);
    });
  });

  it("a letter is never introduced after being exercised", () => {
    const s = planLesson(content, p, 2, 7, TODAY);
    const seen = new Set<string>();
    for (const st of s.steps) {
      if (st.kind === "intro") expect(seen.has(st.letter)).toBe(false);
      seen.add(st.letter);
    }
  });

  it("a lesson adds a discrimination task when the second letter of a pair arrives", () => {
    const i = alphabetLessons(content).findIndex((l) => l.newItems.includes("letter:tho"));
    const s = planLesson(content, p, i, 3, TODAY);
    expect(s.steps).toContainEqual({ kind: "exercise", letter: "tho", types: ["confusable-pair"], pair: ["tyun"] });
  });

  it("pairs trainer has 10 tasks on the chosen pair", () => {
    const s = planPairs([{ letters: ["tyun", "tho"] }], 1, TODAY);
    expect(s.steps).toHaveLength(10);
    expect(s.steps.every((st) => st.kind === "exercise" && st.types?.[0] === "confusable-pair" && ["tyun", "tho"].includes(st.letter))).toBe(true);
  });

  it("final test has 40 exercises of fixed types, then 20 words to read, without retries", () => {
    const s = planFinalTest(content, 1, TODAY);
    expect(s.steps).toHaveLength(60);
    expect(s.steps.slice(40).every((st) => st.kind === "exercise" && st.types?.[0] === "timed-reading")).toBe(true);
    expect(s.options.retries).toBe(false);
    expect(s.steps.every((st) => st.kind === "exercise" && st.types?.length === 1)).toBe(true);
  });

  it("review is empty when nothing is due", () => {
    expect(planReview(p, all, 1, TODAY).steps).toHaveLength(0);
  });

  it("wrong answers come back later in the session", () => {
    const s = planLesson(content, p, 0, 1, TODAY);
    s.index = 5;
    const before = s.steps.length;
    recordAnswer(s, "wrong", "ayb");
    expect(s.steps.length).toBe(before + 1);
    expect(s.steps[10]).toEqual({ kind: "exercise", letter: "ayb", retry: true });
    expect(s.index).toBe(6);
    expect(score(s)).toBe(0);
  });
});

describe("exercise selection", () => {
  it("starts with recognition and moves to recall as recognition grows", () => {
    const p = createEmptyProgress(new Date());
    const tho = content.letters.find((l) => l.id === "tho")!;
    const pick = (seed: number): ExerciseId =>
      chooseExercise({ kind: "exercise", letter: "tho" }, tho, p, { ...ctx(seed) }, createRng(seed), []).type;
    const fresh = new Set([...Array(30)].map((_, i) => pick(i)));
    expect([...fresh].every((t) => ["letter-to-sound", "sound-to-letter"].includes(t))).toBe(true);

    p.items["letter:tho#recognize"] = { box: 3, due: "2026-10-01", ok: 3, bad: 0, last: TODAY };
    const later = new Set([...Array(30)].map((_, i) => pick(i)));
    expect(later.has("letter-type-sound") || later.has("ru-word-insert")).toBe(true);
  });
});
