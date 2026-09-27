import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { itemKey } from "../src/core/progress/knowledge";
import { createEmptyProgress } from "../src/core/progress/schema";
import type { ProgressData } from "../src/core/progress/types";
import { activity, letterLevel, summary, topConfusions } from "../src/core/stats";

// Экран «Статистика» (docs/02-features.md, 2.7).

const TODAY = "2026-09-30"; // среда
const item = (box: number) => ({ box, due: TODAY, ok: 1, bad: 0, last: TODAY });

function progress(): ProgressData {
  const p = createEmptyProgress(new Date());
  // Ա выучена, Մ изучается
  p.items[itemKey("ayb", "recognize")] = item(4);
  p.items[itemKey("ayb", "recall")] = item(3);
  p.items[itemKey("men", "recognize")] = item(1);
  p.items[itemKey("men", "read")] = item(2);
  p.daily = {
    "2026-09-30": { answers: 20, correct: 18 },
    "2026-09-29": { answers: 10, correct: 8 },
    "2026-09-28": { answers: 5, correct: 4 },
    "2026-09-20": { answers: 65, correct: 50 },
  };
  p.confusions = { "letter:tho>letter:tyun": 3, "letter:tyun>letter:tho": 2, "letter:vo>letter:se": 4, "letter:pe>letter:pyur": 1 };
  return p;
}

describe("stats", () => {
  it("summarizes learned letters, days, streak and accuracy", () => {
    const s = summary(progress(), content, TODAY);
    expect(s).toMatchObject({ learned: 1, learning: 1, days: 4, streak: 3, answers: 100 });
    expect(s.accuracy).toBeCloseTo(0.8);
  });

  it("counts the streak up to yesterday when there are no answers today yet", () => {
    expect(summary(progress(), content, "2026-10-01").streak).toBe(3);
    expect(summary(progress(), content, "2026-10-02").streak).toBe(0);
    expect(summary(createEmptyProgress(new Date()), content, TODAY).accuracy).toBeNull();
  });

  it("gives letter levels for the map", () => {
    const p = progress();
    expect(letterLevel(p, "ayb", "main")).toBe(3.5);
    expect(letterLevel(p, "men", "main")).toBe(0.5);
    expect(letterLevel(p, "nu", "main")).toBeNull();
    expect(letterLevel(p, "men", "read")).toBe(2);
    expect(letterLevel(p, "ayb", "read")).toBeNull();
  });

  it("merges confusions in both directions and sorts them", () => {
    expect(topConfusions(progress(), 2)).toEqual([
      { a: "tho", b: "tyun", count: 5 },
      { a: "se", b: "vo", count: 4 },
    ]);
  });

  it("builds a Monday-first calendar ending with the current week", () => {
    const { columns, thisWeek } = activity(progress(), TODAY);
    expect(columns).toHaveLength(12);
    const last = columns[11]!;
    expect(last[0]!.day).toBe("2026-09-28"); // понедельник
    expect(last[2]).toMatchObject({ day: TODAY, answers: 20, level: 2, future: false });
    expect(last[3]!.future).toBe(true);
    expect(thisWeek).toBe(35);
    expect(columns[10]![6]).toMatchObject({ day: "2026-09-27" });
    expect(columns[9]!.concat(columns[10]!).find((d) => d.day === "2026-09-20")!.level).toBe(4);
  });
});
