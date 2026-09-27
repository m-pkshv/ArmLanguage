import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { createEmptyProgress } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import type { HandwritingQuestion } from "../src/exercises/choice";
import { EXERCISES } from "../src/exercises/logic";
import type { ExerciseContext } from "../src/exercises/types";
import { planHandwriting } from "../src/session/plan";

// E11: рукописная ↔ печатная (docs/03-exercises.md).

const ex = EXERCISES["handwriting-match"];
const all = content.letters.map((l) => l.id);
const byId = (id: string) => content.letters.find((l) => l.id === id)!;
const ctx = (seed: number): ExerciseContext => ({ content, rng: createRng(seed), known: all, focus: [], script: "print", level: 0, simpleKeyboard: false });

describe("handwriting-match", () => {
  it("offers 4 different letters that all have the shown handwritten form", () => {
    for (let seed = 1; seed < 6; seed++) {
      for (const l of content.letters) {
        const q = ex.generate(l, ctx(seed * 100 + l.order)) as HandwritingQuestion;
        expect(q.options).toContain(l.id);
        expect(new Set(q.options).size).toBe(4);
        for (const id of q.options) {
          const hw = byId(id).handwriting!;
          expect(q.form === "upper" ? hw.upper : hw.lower, `${l.id} ${q.form} ${id}`).toBeTruthy();
        }
      }
    }
  });

  it("shows և only in lower case and never offers it for capitals", () => {
    for (let seed = 1; seed < 30; seed++) {
      expect((ex.generate(byId("yev"), ctx(seed)) as HandwritingQuestion).form).toBe("lower");
      const q = ex.generate(byId("ayb"), ctx(seed)) as HandwritingQuestion;
      if (q.form === "upper") expect(q.options).not.toContain("yev");
    }
  });

  it("trains the handwriting skill and records confusions", () => {
    const q = ex.generate(byId("vo"), ctx(3)) as HandwritingQuestion;
    const ok = ex.check(q, "vo", { content, strictness: "soft" });
    expect(ok.verdict).toBe("correct");
    expect(ok.effects).toEqual([{ letter: "vo", skill: "handwriting", verdict: "correct" }]);
    const bad = ex.check(q, q.options.find((id) => id !== "vo")!, { content, strictness: "soft" });
    expect(bad.verdict).toBe("wrong");
    expect(bad.confusions[0]![0]).toBe("vo");
  });

  it("plans 10 tasks in practice", () => {
    const s = planHandwriting(createEmptyProgress(new Date()), all.slice(0, 10), 5, "2026-09-28");
    expect(s.kind).toBe("handwriting");
    expect(s.steps).toHaveLength(10);
    expect(s.steps.every((st) => st.kind === "exercise" && st.types?.[0] === "handwriting-match")).toBe(true);
  });
});
