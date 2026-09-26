import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { applyAnswer } from "../src/core/progress/knowledge";
import { createEmptyProgress } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import type { MatchKind } from "../src/core/session/types";
import { formatTime, MATCH_SIZE, type MatchQuestion } from "../src/exercises/matchPairs";
import { EXERCISES } from "../src/exercises/logic";
import type { ExerciseContext } from "../src/exercises/types";
import { planLesson, planMatch } from "../src/session/plan";

// E05: мини-игра «Найди пары» (docs/03-exercises.md).

const ex = EXERCISES["match-pairs"];
const all = content.letters.map((l) => l.id);
const letter = (id: string) => content.letters.find((l) => l.id === id)!;
const ctx = (seed: number, match: MatchKind, group?: string[]): ExerciseContext => ({
  content,
  rng: createRng(seed),
  known: all,
  focus: [],
  script: "print",
  level: 0,
  simpleKeyboard: false,
  group,
  match,
});
const sounds = (id: string) => {
  const s = letter(id).sound;
  return [s.canonical, ...(s.initial ? [s.initial.canonical] : [])];
};

describe("match-pairs board", () => {
  it("has 5 letters with the target, and no two letters sound the same", () => {
    for (const kind of ["sound", "case", "handwriting"] as const) {
      for (const [i, id] of all.entries()) {
        const c = ctx(i + 1, kind);
        if (!ex.isApplicable(letter(id), c)) continue;
        const q = ex.generate(letter(id), c) as MatchQuestion;
        expect(q.left).toContain(id);
        expect(q.left).toHaveLength(MATCH_SIZE);
        expect([...q.right].sort()).toEqual([...q.left].sort());
        expect(q.right.some((r, k) => r === q.left[k]), "пара напротив").toBe(false);
        const heard = q.left.flatMap(sounds);
        expect(new Set(heard).size, `${kind} ${q.left.join(",")}`).toBe(heard.length);
      }
    }
  });

  it("never puts Ո and Օ, or Խ and Հ, on one board", () => {
    for (let seed = 1; seed < 50; seed++) {
      const q = ex.generate(letter("vo"), ctx(seed, "sound", ["vo", "o", "xe", "ho", "ayb", "men"])) as MatchQuestion;
      expect(q.left).not.toContain("o");
      expect(q.left.includes("xe") && q.left.includes("ho")).toBe(false);
    }
  });

  it("skips և for capital letters", () => {
    expect(ex.isApplicable(letter("yev"), ctx(1, "case"))).toBe(false);
    const q = ex.generate(letter("ayb"), ctx(2, "case", ["ayb", "yev", "men", "nu", "se", "tyun"])) as MatchQuestion;
    expect(q.left).not.toContain("yev");
  });

  it("uses only the given group", () => {
    const group = ["ayb", "men", "nu", "tyun", "se"];
    const q = ex.generate(letter("men"), ctx(3, "sound", group)) as MatchQuestion;
    expect([...q.left].sort()).toEqual([...group].sort());
  });
});

describe("match-pairs result", () => {
  const q: MatchQuestion = { kind: "sound", left: ["ayb", "men", "nu", "tyun", "tho"], right: ["tho", "nu", "ayb", "men", "tyun"] };
  const check = (mistakes: [string, string][], ms = 14200) => ex.check(q, { ms, mistakes }, { content, strictness: "soft" });

  it("counts every letter and keeps a record only without mistakes", () => {
    const r = check([]);
    expect(r.verdict).toBe("correct");
    expect(r.effects).toHaveLength(5);
    expect(r.effects.every((e) => e.skill === "recognize" && e.verdict === "correct")).toBe(true);
    expect(r.record).toEqual({ game: "sound", ms: 14200 });
    expect(r.explanation.title).toContain("0:14");
  });

  it("marks the mistaken letter and records a confusion with its partner", () => {
    const r = check([["tho", "tyun"]]);
    expect(r.verdict).toBe("partial");
    expect(r.record).toBeUndefined();
    expect(r.effects.find((e) => e.letter === "tho")!.verdict).toBe("wrong");
    expect(r.effects.find((e) => e.letter === "ayb")!.verdict).toBe("correct");
    expect(r.confusions).toEqual([["tho", "tyun"]]);
    expect(check([["ayb", "nu"]]).confusions).toEqual([]);
  });

  it("stores only a better record", () => {
    const p = createEmptyProgress(new Date());
    applyAnswer(p, check([], 20000), "2026-09-27");
    applyAnswer(p, check([], 25000), "2026-09-28");
    expect(p.games.sound).toEqual({ bestMs: 20000, at: "2026-09-27" });
    applyAnswer(p, check([], 12000), "2026-09-29");
    expect(p.games.sound!.bestMs).toBe(12000);
  });

  it("formats time", () => {
    expect(formatTime(9400)).toBe("0:09");
    expect(formatTime(75000)).toBe("1:15");
  });
});

describe("match-pairs in sessions", () => {
  it("warms up lessons from the second one with a board of previous letters", () => {
    const p = createEmptyProgress(new Date());
    expect(planLesson(content, p, 0, 1, "2026-09-27").steps.some((s) => s.kind === "exercise" && s.types?.includes("match-pairs"))).toBe(false);
    const s = planLesson(content, p, 3, 1, "2026-09-27");
    const first = s.steps[0]!;
    expect(first.kind === "exercise" && first.types?.[0]).toBe("match-pairs");
    const lessons = content.course.sections[0]!.lessons.slice(0, 3).flatMap((l) => l.newItems.map((i) => i.replace("letter:", "")));
    if (first.kind === "exercise") expect(first.group!.every((id) => lessons.includes(id))).toBe(true);
  });

  it("plans three boards in practice", () => {
    const known = all.slice(0, 12);
    const s = planMatch(createEmptyProgress(new Date()), known, "case", 7, "2026-09-27");
    expect(s.kind).toBe("match");
    expect(s.steps).toHaveLength(3);
    for (const st of s.steps) if (st.kind === "exercise") expect(st.match).toBe("case");
  });
});
