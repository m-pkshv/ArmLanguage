import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { migrate } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import type { SavedSession } from "../src/core/session/types";
import { EXERCISES } from "../src/exercises/logic";
import { readingTestWords, type TimedQuestion } from "../src/exercises/timedReading";
import type { ExerciseContext } from "../src/exercises/types";
import { planFinalTest } from "../src/session/plan";
import { finalPassed, readingResult, recordAnswer } from "../src/session/run";

// Итоговый тест, часть 2: чтение 20 незнакомых слов на время (docs/02-features.md, 2.5).

const ex = EXERCISES["timed-reading"];
const all = content.letters.map((l) => l.id);
const TODAY = "2026-09-28";

describe("timed reading words", () => {
  it("has enough words that read letter by letter", () => {
    const words = readingTestWords(content);
    expect(words.length).toBeGreaterThanOrEqual(40);
    expect(words.some((w) => w.exception || w.pronunciation.includes("ы") && !w.hy.includes("ը"))).toBe(false);
  });

  it("gives 3 different readings with the right one for every test word", () => {
    for (const [i, w] of readingTestWords(content).entries()) {
      const letter = content.letters.find((l) => w.hy.toLocaleLowerCase("hy").startsWith(l.lower))!;
      const ctx: ExerciseContext = { content, rng: createRng(i + 1), known: all, focus: [], script: "print", level: 0, simpleKeyboard: false, reading: { word: w.id, n: 1, total: 20 } };
      const q = ex.generate(letter, ctx) as TimedQuestion;
      expect(q.options, w.hy).toContain(w.pronunciation);
      expect(new Set(q.options).size, w.hy).toBe(3);
    }
  });

  it("counts time and correctness separately from the tasks", () => {
    const w = readingTestWords(content)[0]!;
    const q: TimedQuestion = { letter: "ayb", word: w.id, n: 1, total: 20, options: [w.pronunciation, "x", "y"], misread: [null, "ayb", "ayb"] };
    const ok = ex.check(q, { value: w.pronunciation, ms: 2300 }, { content, strictness: "soft" });
    expect(ok.timing).toEqual({ ok: true, ms: 2300 });
    expect(ok.explanation.lines[0]).toContain("2,3");
    expect(ex.check(q, { value: "x", ms: 4000 }, { content, strictness: "soft" }).timing).toEqual({ ok: false, ms: 4000 });
  });
});

describe("final test with reading", () => {
  const finish = (tasksOk: number, readOk: number, msPerWord: number): SavedSession => {
    const s = planFinalTest(content, 3, TODAY);
    for (let i = 0; i < 40; i++) recordAnswer(s, i < tasksOk ? "correct" : "wrong", "ayb");
    for (let i = 0; i < 20; i++) recordAnswer(s, i < readOk ? "correct" : "wrong", "ayb", { ok: i < readOk, ms: msPerWord });
    return s;
  };

  it("passes with 90% of tasks and 18 of 20 words at 5 s or faster", () => {
    const s = finish(37, 18, 4800);
    expect(s.result.correct + s.result.wrong).toBe(40); // чтение не входит в процент заданий
    expect(readingResult(s)).toMatchObject({ correct: 18, total: 20, avgMs: 4800, passed: true });
    expect(finalPassed(s)).toBe(true);
  });

  it("fails when reading is too slow or has too many mistakes", () => {
    expect(finalPassed(finish(40, 20, 5600))).toBe(false);
    expect(finalPassed(finish(40, 17, 2000))).toBe(false);
    expect(finalPassed(finish(35, 20, 2000))).toBe(false);
  });

  it("migrates saved final test results to v4", () => {
    const d = migrate({ schemaVersion: 3, finalTest: { bestScore: 0.95, passedAt: "2026-09-20" } }, new Date());
    expect(d.finalTest).toEqual({ bestScore: 0.95, passedAt: "2026-09-20", bestReading: null });
  });
});
