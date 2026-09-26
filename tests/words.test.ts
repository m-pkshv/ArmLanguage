import { describe, expect, it } from "vitest";
import { checkWordReading } from "../src/core/checking/word";
import { content } from "../src/core/content";
import { createEmptyProgress } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import { indexLetters, letterwise } from "../src/core/text/armenian";
import { EXERCISES } from "../src/exercises/logic";
import type { ExerciseContext } from "../src/exercises/types";
import { wordsToRead, type WordReadingQuestion } from "../src/exercises/wordReading";
import { planLesson, planWords } from "../src/session/plan";

// E07: прочитай слово (docs/03-exercises.md).

const index = indexLetters(content.letters);
const word = (hy: string) => content.words.find((w) => w.hy === hy)!;
const check = (hy: string, input: string, strictness: "soft" | "strict" = "soft") => checkWordReading(word(hy), input, content, strictness);
const statuses = (hy: string, input: string) => check(hy, input).letters.map((l) => `${l.token}:${l.status}:${l.given}`);

describe("checkWordReading", () => {
  it("accepts the pronunciation and the letter-by-letter reading without «ы»", () => {
    expect(check("խնձոր", "хындзор").verdict).toBe("correct");
    expect(check("խնձոր", "хындзор").schwaOmitted).toBe(false);
    const r = check("խնձոր", "хндзор");
    expect(r.verdict).toBe("correct");
    expect(r.schwaOmitted).toBe(true);
    expect(check("վագր", "вагр").verdict).toBe("correct");
    expect(check("ձուկ", " Дзук ").verdict).toBe("correct");
  });

  it("marks the misread letter", () => {
    const r = check("ձուկ", "зук");
    expect(r.verdict).toBe("wrong");
    expect(statuses("ձուկ", "зук")).toEqual(["ձ:wrong:з", "ու:ok:у", "կ:ok:к"]);
    expect(statuses("ձուկ", "дзик")).toEqual(["ձ:ok:дз", "ու:wrong:и", "կ:ok:к"]);
    expect(statuses("ձուկ", "дзу")).toEqual(["ձ:ok:дз", "ու:ok:у", "կ:wrong:"]);
  });

  it("counts missing aspiration and initial «йе»/«во» as partial", () => {
    expect(check("քար", "кар").verdict).toBe("partial");
    expect(check("քար", "кар", "strict").verdict).toBe("wrong");
    expect(check("թեյ", "тей").letters[0]!.status).toBe("partial");
    expect(check("երեխա", "ереха").verdict).toBe("partial");
    expect(check("երեխա", "йереха").verdict).toBe("correct");
    expect(check("ոսկի", "воски").verdict).toBe("correct");
    expect(check("ոսկի", "оски").verdict).toBe("partial");
  });

  it("does not allow «ы» next to a vowel", () => {
    expect(check("ձուկ", "дзыук").verdict).toBe("wrong");
  });

  it("handles exceptions", () => {
    expect(check("եմ", "эм").verdict).toBe("correct");
    const r = check("եմ", "йем");
    expect(r.verdict).toBe("partial");
    expect(r.exceptionByRule).toBe(true);
    expect(check("եմ", "ам").verdict).toBe("wrong");
  });

  it("reads every word of the bank by its pronunciation and letter by letter", () => {
    for (const w of content.words) {
      expect(check(w.hy, w.pronunciation).verdict, w.hy).toBe("correct");
      if (!w.exception) expect(check(w.hy, letterwise(w.hy, index)).verdict, w.hy).toBe("correct");
    }
  });
});

describe("word-type-reading exercise", () => {
  const ex = EXERCISES["word-type-reading"];
  const all = content.letters.map((l) => l.id);
  const ctx = (seed: number, known: string[], level = 0): ExerciseContext => ({
    content,
    rng: createRng(seed),
    known,
    focus: [],
    script: "print",
    level,
    simpleKeyboard: false,
  });

  it("picks only words made of known letters, with the target letter", () => {
    const known = ["ayb", "men", "nu", "tyun", "se"];
    for (let seed = 1; seed < 30; seed++) {
      const letter = content.letters.find((l) => l.id === known[seed % known.length])!;
      const c = ctx(seed, known);
      if (!ex.isApplicable(letter, c)) continue;
      const q = ex.generate(letter, c) as WordReadingQuestion;
      expect(wordsToRead(content, letter.id, known).map((w) => w.id)).toContain(q.word);
      expect(q.hint).toBe(true);
    }
  });

  it("prefers short words at first and hides the picture later", () => {
    const letter = content.letters.find((l) => l.id === "ini")!;
    for (let seed = 1; seed < 20; seed++) {
      const q = ex.generate(letter, ctx(seed, all, 0)) as WordReadingQuestion;
      expect([...content.words.find((w) => w.id === q.word)!.hy.replace("ու", "u")].length).toBeLessThanOrEqual(4);
      expect((ex.generate(letter, ctx(seed, all, 4)) as WordReadingQuestion).hint).toBe(false);
    }
  });

  it("gives read effects per letter and records confusions", () => {
    const q: WordReadingQuestion = { letter: "dza", word: word("ձուկ").id, hint: true };
    const ok = ex.check(q, { value: "дзук", hinted: [] }, { content, strictness: "soft" });
    expect(ok.verdict).toBe("correct");
    expect(ok.effects.every((e) => e.skill === "read" && e.verdict === "correct")).toBe(true);

    const hinted = ex.check(q, { value: "дзук", hinted: [0] }, { content, strictness: "soft" });
    expect(hinted.verdict).toBe("partial");
    expect(hinted.effects.find((e) => e.letter === "dza")!.verdict).toBe("partial");
    expect(hinted.effects.find((e) => e.letter === "ken")!.verdict).toBe("correct");

    const shape = ex.check({ letter: "vo", word: word("ծով").id, hint: true }, { value: "цсв", hinted: [] }, { content, strictness: "soft" });
    expect(shape.confusions).toEqual([["vo", "se"]]);
    const tho: WordReadingQuestion = { letter: "tho", word: word("թեյ").id, hint: true };
    const strict = ex.check(tho, { value: "тей", hinted: [] }, { content, strictness: "strict" });
    expect(strict.verdict).toBe("wrong");
    const ch = ex.check({ letter: "ken", word: word("քար").id, hint: true }, { value: "хар", hinted: [] }, { content, strictness: "soft" });
    expect(ch.verdict).toBe("wrong");
    expect(ch.explanation.lines.join(" ")).toMatch(/прочитано как «х» — это «кх»/);
  });
});

describe("word reading in sessions", () => {
  it("ends every lesson with a word to read", () => {
    const lessons = content.course.sections[0]!.lessons;
    lessons.forEach((_, i) => {
      const s = planLesson(content, createEmptyProgress(new Date()), i, 5 + i, "2026-09-27");
      const last = s.steps.filter((st) => st.kind === "exercise" && st.types?.includes("word-type-reading"));
      expect(last.length, `урок ${i + 1}`).toBe(1);
    });
  });

  it("plans 10 words in practice", () => {
    const known = ["ayb", "men", "nu", "tyun", "se"];
    const s = planWords(content, known, 3, "2026-09-27");
    expect(s.steps).toHaveLength(10);
    for (const st of s.steps) expect(wordsToRead(content, st.letter, known).length).toBeGreaterThan(0);
  });
});
