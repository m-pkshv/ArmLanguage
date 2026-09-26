import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { checkLetterSound, keyToRussian, normalize, soundLabel } from "../src/core/checking/answer";
import { addDays, daysBetween, toDay } from "../src/core/dates";
import { createEmptyProgress } from "../src/core/progress/schema";
import { applyAnswer, dueLetters, isLearned, itemKey } from "../src/core/progress/knowledge";
import { review } from "../src/core/progress/srs";
import { createRng } from "../src/core/random";

const DAY = "2026-09-26";
const letter = (id: string) => content.letters.find((l) => l.id === id)!;

describe("dates", () => {
  it("adds days across months", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(daysBetween("2026-09-26", "2026-10-02")).toBe(6);
    expect(toDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("review (Leitner)", () => {
  it("promotes a due item and schedules by interval", () => {
    const s1 = review(undefined, "correct", DAY);
    expect(s1).toMatchObject({ box: 1, due: "2026-09-27", ok: 1 });
    const s2 = review(s1, "correct", "2026-09-27");
    expect(s2).toMatchObject({ box: 2, due: "2026-09-30" });
  });

  it("does not promote twice on the same day", () => {
    const s1 = review(undefined, "correct", DAY);
    expect(review(s1, "correct", DAY)).toMatchObject({ box: 1, due: "2026-09-27", ok: 2 });
  });

  it("drops two boxes on a mistake and makes it due today", () => {
    const s = { box: 4, due: DAY, ok: 5, bad: 0, last: DAY };
    expect(review(s, "wrong", DAY)).toMatchObject({ box: 2, due: DAY, bad: 1 });
    expect(review({ ...s, box: 1 }, "wrong", DAY).box).toBe(0);
  });

  it("keeps the box on a partial answer", () => {
    const s = { box: 2, due: DAY, ok: 1, bad: 0, last: DAY };
    expect(review(s, "partial", DAY)).toMatchObject({ box: 2, due: "2026-09-29" });
  });
});

describe("knowledge", () => {
  it("counts a letter as learned when both main skills reach box 3", () => {
    const p = createEmptyProgress(new Date());
    p.items[itemKey("tho", "recognize")] = { box: 3, due: "2026-10-03", ok: 3, bad: 0, last: DAY };
    expect(isLearned(p, "tho")).toBe(false);
    p.items[itemKey("tho", "recall")] = { box: 3, due: "2026-10-03", ok: 3, bad: 0, last: DAY };
    expect(isLearned(p, "tho")).toBe(true);
  });

  it("lists due letters, most overdue first", () => {
    const p = createEmptyProgress(new Date());
    p.items[itemKey("ayb", "recognize")] = { box: 1, due: "2026-09-25", ok: 1, bad: 0, last: "2026-09-24" };
    p.items[itemKey("men", "recall")] = { box: 1, due: "2026-09-20", ok: 1, bad: 0, last: "2026-09-19" };
    p.items[itemKey("nu", "recall")] = { box: 2, due: "2026-09-30", ok: 1, bad: 0, last: DAY };
    expect(dueLetters(p, DAY, ["ayb", "men", "nu"])).toEqual(["men", "ayb"]);
  });

  it("records answers, daily stats and confusions", () => {
    const p = createEmptyProgress(new Date());
    applyAnswer(p, { verdict: "wrong", effects: [{ letter: "tho", skill: "recognize", verdict: "wrong" }], confusions: [["tho", "tyun"]] }, DAY);
    expect(p.items[itemKey("tho", "recognize")]?.bad).toBe(1);
    expect(p.daily[DAY]).toEqual({ answers: 1, correct: 0 });
    expect(p.confusions["letter:tho>letter:tyun"]).toBe(1);
  });
});

describe("answer checking", () => {
  it("normalizes input", () => {
    expect(normalize("  ЙЁ  ")).toBe("йе");
  });

  it("maps latin keys to russian by keyboard position", () => {
    expect(keyToRussian("n")).toBe("т");
    expect(keyToRussian("[")).toBe("х");
    expect(keyToRussian("Т")).toBe("т");
    expect(keyToRussian("1")).toBeNull();
  });

  it("checks aspirated letters softly or strictly", () => {
    expect(checkLetterSound(letter("tho"), "тх", "soft").verdict).toBe("correct");
    expect(checkLetterSound(letter("tho"), "т", "soft").verdict).toBe("partial");
    expect(checkLetterSound(letter("tho"), "т", "strict").verdict).toBe("wrong");
    expect(checkLetterSound(letter("tho"), "п", "soft").verdict).toBe("wrong");
  });

  it("accepts both readings of word-initial letters", () => {
    expect(checkLetterSound(letter("yech"), "е", "soft").verdict).toBe("correct");
    expect(checkLetterSound(letter("yech"), "йе", "soft").verdict).toBe("correct");
    expect(checkLetterSound(letter("vo"), "во", "soft").verdict).toBe("correct");
  });

  it("labels sounds uniquely", () => {
    const labels = content.letters.map(soundLabel);
    expect(new Set(labels).size).toBe(labels.length);
    expect(soundLabel(letter("ho"))).toContain("h");
  });
});

describe("rng", () => {
  it("is deterministic", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.int(10), a.shuffle([1, 2, 3, 4])]).toEqual([b.next(), b.int(10), b.shuffle([1, 2, 3, 4])]);
  });
});
