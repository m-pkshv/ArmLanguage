// Итоговый тест алфавита доступен сразу: сдавший его открывает «Первые слова» без уроков
// (решение владельца, 2026-09-28; docs/09-navigation.md, 9.5; docs/10-first-words.md, 10.2).
import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { alphabetLessons, openLessons, TEST_REVIEW_DELAY } from "../src/core/course";
import { addDays } from "../src/core/dates";
import { createEmptyProgress } from "../src/core/progress/schema";
import { firstWordsOpen, themes } from "../src/core/words";
import { nextAction } from "../src/session/next";

const TODAY = "2026-09-28";
const fresh = () => createEmptyProgress(new Date(`${TODAY}T10:00:00Z`));
const lessons = alphabetLessons(content);

/** Новичок сдал итоговый тест, не проходя уроков (как в finishSession). */
function passedEarly() {
  const p = fresh();
  p.finalTest = { bestScore: 0.95, passedAt: TODAY, bestReading: { correct: 19, avgMs: 3000 } };
  openLessons(p, content, lessons.length, TODAY, true);
  return p;
}

describe("early final test", () => {
  it("keeps words closed until lesson 8 or a passed final test", () => {
    const p = fresh();
    expect(firstWordsOpen(p, content)).toBe(false);
    p.finalTest = { bestScore: 0.6, passedAt: null, bestReading: null };
    expect(firstWordsOpen(p, content)).toBe(false);
    p.finalTest.passedAt = TODAY;
    expect(firstWordsOpen(p, content)).toBe(true);
  });

  it("marks all alphabet lessons as opened by the test", () => {
    const p = passedEarly();
    for (const l of lessons) expect(p.lessons[l.id]).toEqual({ completedAt: TODAY, skipped: true, byTest: true });
  });

  it("schedules the letters for review in a few days, so «Continue» leads to words right away", () => {
    const p = passedEarly();
    const dues = new Set(Object.values(p.items).map((i) => i.due));
    expect([...dues]).toEqual([addDays(TODAY, TEST_REVIEW_DELAY)]);
    const first = themes(content).find((t) => t.status === "available")!;
    expect(nextAction(p, content, TODAY)).toEqual({ kind: "theme-lesson", themeId: first.id, index: 0 });
  });

  it("does not touch lessons already done, and «I know these letters» still reviews today", () => {
    const p = fresh();
    p.lessons[lessons[0]!.id] = { completedAt: "2026-09-20" };
    openLessons(p, content, 3, TODAY, false);
    expect(p.lessons[lessons[0]!.id]).toEqual({ completedAt: "2026-09-20" });
    expect(p.lessons[lessons[1]!.id]).toEqual({ completedAt: TODAY, skipped: true });
    expect(p.lessons[lessons[3]!.id]).toBeUndefined();
    expect(Object.values(p.items).every((i) => i.due === TODAY)).toBe(true);
  });
});
