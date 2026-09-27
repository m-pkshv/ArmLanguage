import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { alphabetLessons } from "../src/core/course";
import { createEmptyProgress } from "../src/core/progress/schema";
import type { ProgressData } from "../src/core/progress/types";
import { dueStudyItems, isStudyItem, themes } from "../src/core/words";
import { nextAction } from "../src/session/next";
import { planReview, REVIEW_MAX } from "../src/session/plan";

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

describe("common review of letters and words", () => {
  const item = (due: string, box = 1) => ({ box, due, ok: 1, bad: 0, last: "2026-09-20" });

  function withDue(letters: number, words: number): ProgressData {
    const p = afterAlphabet();
    p.finalTest = { bestScore: 1, passedAt: TODAY, bestReading: null };
    for (const l of content.letters.slice(0, letters)) {
      p.items[`letter:${l.id}#recognize`] = item("2026-09-25", 3);
      p.items[`letter:${l.id}#recall`] = item("2026-09-25", 3);
    }
    for (const id of list.flatMap((t) => t.lessons.flatMap((l) => l.newItems)).slice(0, words)) {
      p.items[`${id}#meaning`] = item("2026-09-20");
    }
    return p;
  }

  it("counts letters and words together for the main button", () => {
    const p = withDue(4, 6);
    expect(dueStudyItems(content, p, TODAY)).toHaveLength(6);
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "review", count: 10 });
    expect(nextAction(withDue(4, 5), content, TODAY).kind).toBe("theme-lesson");
  });

  it("mixes letters and words in one review, the most overdue first, up to 30 tasks", () => {
    const p = withDue(15, 25);
    const known = content.letters.map((l) => l.id);
    const s = planReview(p, known, 1, TODAY, dueStudyItems(content, p, TODAY));
    const ids = s.steps.map((st) => st.letter);
    expect(s.kind).toBe("review");
    expect(ids.length).toBeLessThanOrEqual(REVIEW_MAX);
    // слова просрочены сильнее — берутся первыми (20 слов), остальное место — буквы
    expect(ids.filter(isStudyItem)).toHaveLength(20);
    expect(ids.filter((id) => !isStudyItem(id))).toHaveLength(10);
  });

  it("keeps the letters-only review when there are no words", () => {
    const p = withDue(5, 0);
    const s = planReview(p, content.letters.map((l) => l.id), 1, TODAY);
    expect(s.steps).toHaveLength(5);
    expect(s.steps.every((st) => !isStudyItem(st.letter))).toBe(true);
  });
});
