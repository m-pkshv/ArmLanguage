// Слова у урока алфавита (docs/09-navigation.md, «Слова урока»): подбор для итогового экрана и экрана урока.
import { describe, expect, it } from "vitest";
import { content, wordById } from "../src/core/content";
import { alphabetLessons, isGoodExample, lessonLetters, lessonNewWords, lessonWords, readableWords } from "../src/core/course";
import { indexLetters, lettersOf } from "../src/core/text/armenian";

const lessons = alphabetLessons(content);
const letters = indexLetters(content.letters);

describe("lessonWords", () => {
  it("shows only words opened by this lesson", () => {
    lessons.forEach((lesson, i) => {
      const known = new Set(lessons.slice(0, i + 1).flatMap(lessonLetters));
      const fresh = new Set(lessonLetters(lesson));
      const before = new Set(readableWords(content, lessons.slice(0, i).flatMap(lessonLetters)));
      for (const id of lessonWords(content, lessons, i, 8)) {
        const ls = lettersOf(wordById(id)!.hy, letters).map((l) => l!.id);
        expect(ls.every((l) => known.has(l)), id).toBe(true);
        expect(ls.some((l) => fresh.has(l)), id).toBe(true);
        expect(before.has(id), id).toBe(false);
      }
    });
  });

  it("prefers pictured regular words (no function words or names), simple ones first, and respects the limit", () => {
    lessons.forEach((_, i) => {
      const all = lessonNewWords(content, lessons, i);
      const shown = lessonWords(content, lessons, i, 6);
      expect(shown.length).toBe(Math.min(6, all.length));
      const good = all.filter((id) => isGoodExample(wordById(id)!));
      if (good.length >= 6) {
        for (const id of shown) expect(good).toContain(id);
        const levels = shown.map((id) => wordById(id)!.level);
        expect([...levels].sort((a, b) => a - b)).toEqual(levels);
      }
    });
  });

  it("does not treat function words and names as good examples", () => {
    for (const hy of ["մի", "կա", "Անի"]) expect(isGoodExample(content.words.find((w) => w.hy === hy)!), hy).toBe(false);
    expect(isGoodExample(content.words.find((w) => w.hy === "մուկ")!)).toBe(true);
  });

  it("is stable: the same lesson always gives the same words", () => {
    expect(lessonWords(content, lessons, 2, 6)).toEqual(lessonWords(content, lessons, 2, 6));
    // первые 6 из 8 — те же, что показываются после урока
    expect(lessonWords(content, lessons, 3, 8).slice(0, 6)).toEqual(lessonWords(content, lessons, 3, 6));
  });
});
