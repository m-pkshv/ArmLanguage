import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { alphabetLessons } from "../src/core/course";
import { createEmptyProgress } from "../src/core/progress/schema";
import type { ProgressData } from "../src/core/progress/types";
import { themes } from "../src/core/words";
import { nextAction } from "../src/session/next";

// Кнопка «Продолжить» на главном экране (docs/09-navigation.md, 9.4).

const TODAY = "2026-09-28";
const done = { completedAt: TODAY };
const list = themes(content).filter((t) => t.status === "available");

function afterAlphabet(): ProgressData {
  const p = createEmptyProgress(new Date(`${TODAY}T10:00:00Z`));
  for (const l of alphabetLessons(content)) p.lessons[l.id] = done;
  return p;
}

describe("next action", () => {
  it("offers the first alphabet lesson at start", () => {
    const p = createEmptyProgress(new Date(`${TODAY}T10:00:00Z`));
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "lesson", index: 0 });
  });

  it("offers the alphabet final test once after lesson 8", () => {
    expect(nextAction(afterAlphabet(), content, TODAY)).toEqual({ kind: "final" });
  });

  it("goes to the first theme after the final test, even if it failed", () => {
    const p = afterAlphabet();
    p.finalTest = { bestScore: 0.5, passedAt: null, bestReading: null };
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "theme-lesson", themeId: list[0]!.id, index: 0 });
  });

  it("continues with the next lesson of the first unfinished theme", () => {
    const p = afterAlphabet();
    p.finalTest = { bestScore: 1, passedAt: TODAY, bestReading: null };
    p.lessons[list[0]!.lessons[0]!.id] = done;
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "theme-lesson", themeId: list[0]!.id, index: 1 });
  });

  it("offers the theme test once, then moves to the next theme", () => {
    const p = afterAlphabet();
    p.finalTest = { bestScore: 1, passedAt: TODAY, bestReading: null };
    for (const l of list[0]!.lessons) p.lessons[l.id] = done;
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "theme-test", themeId: list[0]!.id });
    p.themeTests[list[0]!.id] = { bestScore: 0.6, passedAt: null };
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "theme-lesson", themeId: list[1]!.id, index: 0 });
  });

  it("offers free practice when everything is done", () => {
    const p = afterAlphabet();
    p.finalTest = { bestScore: 1, passedAt: TODAY, bestReading: null };
    for (const t of list) {
      for (const l of t.lessons) p.lessons[l.id] = done;
      p.themeTests[t.id] = { bestScore: 1, passedAt: TODAY };
    }
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "practice" });
  });
});
