import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { applyAnswer } from "../src/core/progress/knowledge";
import { createEmptyProgress, migrate } from "../src/core/progress/schema";
import { createRng } from "../src/core/random";
import { dueItems, firstWordsOpen, showReading, studyItem, themeById, themeItems, themeLessonStatus } from "../src/core/words";
import { phraseTokens, WORD_EXERCISES, type PhraseBuildQuestion, type WordChoiceQuestion, type WordContext } from "../src/exercises/words/logic";
import { planThemeLesson, planThemeTest, planWordsReview } from "../src/session/wordPlan";
import { chooseWordExercise } from "../src/session/wordSelect";

// Раздел «Первые слова» (docs/10-first-words.md).

const TODAY = "2026-09-28";
const theme = themeById(content, "greetings")!;
const pool = themeItems(theme);
const ctx = (seed: number, reading = true): WordContext => ({ content, rng: createRng(seed), pool, reading });
const check = { content, strictness: "soft" as const };

describe("first words content", () => {
  it("resolves every item of the theme", () => {
    expect(pool.length).toBeGreaterThanOrEqual(25);
    for (const id of pool) expect(studyItem(content, id).ru, id).toBeTruthy();
  });

  it("splits phrases into words without punctuation", () => {
    expect(phraseTokens("Լավ եմ, շնորհակալություն։")).toEqual(["Լավ", "եմ", "շնորհակալություն"]);
    expect(phraseTokens("Ինչպե՞ս ես։")).toEqual(["Ինչպե՞ս", "ես"]);
  });
});

describe("first words exercises", () => {
  it("builds 4 different options for every word and 3 for every phrase", () => {
    for (const [i, id] of pool.entries()) {
      const item = studyItem(content, id);
      const types = item.kind === "word" ? (["word-meaning", "word-produce"] as const) : (["phrase-meaning"] as const);
      for (const type of types) {
        const q = WORD_EXERCISES[type].generate(item, ctx(i + 1)) as WordChoiceQuestion;
        expect(q.options, `${type} ${id}`).toContain(id);
        expect(new Set(q.options).size).toBe(item.kind === "word" ? 4 : 3);
        const texts = q.options.map((o) => studyItem(content, o)[type === "word-produce" ? "hy" : "ru"]);
        expect(new Set(texts).size, `${type} ${id}: одинаковые варианты`).toBe(texts.length);
      }
    }
  });

  it("checks choice answers and trains the right skill", () => {
    const q = WORD_EXERCISES["word-produce"].generate(studyItem(content, "word:barev"), ctx(3)) as WordChoiceQuestion;
    const ok = WORD_EXERCISES["word-produce"].check(q, "word:barev", check);
    expect(ok.verdict).toBe("correct");
    expect(ok.effects).toEqual([{ letter: "", item: "word:barev", skill: "produce", verdict: "correct" }]);
    const bad = WORD_EXERCISES["word-produce"].check(q, q.options.find((o) => o !== "word:barev")!, check);
    expect(bad.verdict).toBe("wrong");
    expect(bad.explanation.lines[0]).toMatch(/Вы выбрали/);
  });

  it("builds a phrase from words with extra cards", () => {
    const item = studyItem(content, "phrase:lav-em");
    const q = WORD_EXERCISES["phrase-build"].generate(item, ctx(5)) as PhraseBuildQuestion;
    expect(q.tokens).toEqual(["Լավ", "եմ", "շնորհակալություն"]);
    expect(q.bank.length).toBeGreaterThan(q.tokens.length);
    for (const w of q.tokens) expect(q.bank).toContain(w);
    expect(WORD_EXERCISES["phrase-build"].check(q, q.tokens, check).verdict).toBe("correct");
    expect(WORD_EXERCISES["phrase-build"].check(q, [...q.tokens].reverse(), check).verdict).toBe("wrong");
  });

  it("starts with meaning and moves to producing the word", () => {
    const p = createEmptyProgress(new Date());
    const item = studyItem(content, "word:barev");
    const step = { kind: "exercise" as const, letter: item.id };
    expect(chooseWordExercise(step, item, p, ctx(1), createRng(1), [])).toBe("word-meaning");
    p.items["word:barev#meaning"] = { box: 2, due: TODAY, ok: 2, bad: 0, last: TODAY };
    expect(chooseWordExercise(step, item, p, ctx(1), createRng(1), [])).toBe("word-produce");
    const phrase = studyItem(content, "phrase:lav-em");
    expect(chooseWordExercise({ kind: "exercise", letter: phrase.id }, phrase, p, ctx(1), createRng(1), [])).toBe("phrase-meaning");
  });

  it("stores word progress under the item key and hides the reading from level 2", () => {
    const p = createEmptyProgress(new Date());
    expect(showReading(p, "word:barev")).toBe(true);
    applyAnswer(p, { effects: [{ letter: "", item: "word:barev", skill: "meaning", verdict: "correct" }], verdict: "correct", confusions: [] }, TODAY);
    expect(p.items["word:barev#meaning"]).toBeTruthy();
    p.items["word:barev#meaning"]!.box = 2;
    expect(showReading(p, "word:barev")).toBe(false);
  });
});

describe("first words sessions", () => {
  it("opens after the 8th alphabet lesson; lessons of a theme go in order", () => {
    const p = createEmptyProgress(new Date());
    expect(firstWordsOpen(p, content)).toBe(false);
    for (let i = 1; i <= 8; i++) p.lessons[`alphabet-${i}`] = { completedAt: TODAY };
    expect(firstWordsOpen(p, content)).toBe(true);
    expect(themeLessonStatus(p, theme, 0)).toBe("current");
    expect(themeLessonStatus(p, theme, 1)).toBe("locked");
  });

  it("plans a theme lesson with intros for every new item", () => {
    const s = planThemeLesson(content, "greetings", 1, 7, TODAY);
    expect(s.kind).toBe("theme-lesson");
    expect(s.lessonId).toBe("greetings-2");
    const intros = s.steps.filter((st) => st.kind === "intro").map((st) => st.letter);
    expect(intros).toEqual(theme.lessons[1]!.newItems);
    // разминка по первому уроку
    expect(theme.lessons[0]!.newItems).toContain(s.steps[0]!.letter);
    expect(s.steps.length).toBeGreaterThanOrEqual(20);
  });

  it("plans a 15-task theme test without retries", () => {
    const s = planThemeTest(content, "greetings", 3, TODAY);
    expect(s.steps).toHaveLength(15);
    expect(s.options.retries).toBe(false);
    expect(s.themeId).toBe("greetings");
  });

  it("reviews only seen words that are due", () => {
    const p = createEmptyProgress(new Date());
    p.items["word:barev#meaning"] = { box: 1, due: TODAY, ok: 1, bad: 0, last: "2026-09-27" };
    p.items["word:lav#meaning"] = { box: 2, due: "2026-10-05", ok: 1, bad: 0, last: TODAY };
    expect(dueItems(p, TODAY, pool)).toEqual(["word:barev"]);
    expect(planWordsReview(content, p, 1, TODAY).steps.map((s) => s.letter)).toEqual(["word:barev"]);
  });

  it("migrates progress to v5 with theme tests", () => {
    const d = migrate({ schemaVersion: 4, themeTests: undefined }, new Date());
    expect(d.themeTests).toEqual({});
    expect(migrate({ schemaVersion: 5, themeTests: { greetings: { bestScore: 0.9, passedAt: TODAY }, bad: 1 } }, new Date()).themeTests).toEqual({
      greetings: { bestScore: 0.9, passedAt: TODAY },
    });
  });
});

describe("numbers and family themes", () => {
  it("puts numbers right after greetings", () => {
    const order = content.course.sections.find((s) => s.id === "first-words")!.themes!.map((t) => t.id);
    expect(order.slice(0, 3)).toEqual(["greetings", "numbers", "family"]);
    expect(themeById(content, "numbers")!.status).toBe("available");
    expect(themeById(content, "family")!.status).toBe("available");
  });

  it("never offers a synonym as a wrong answer (мама — մամա / մայր)", () => {
    const pool = themeItems(themeById(content, "family")!);
    for (let seed = 1; seed < 60; seed++) {
      for (const id of ["word:mama", "word:mayr", "word:papa", "word:hayr"]) {
        const q = WORD_EXERCISES["word-produce"].generate(studyItem(content, id), { content, rng: createRng(seed), pool, reading: true }) as WordChoiceQuestion;
        const other = { "word:mama": "word:mayr", "word:mayr": "word:mama", "word:papa": "word:hayr", "word:hayr": "word:papa" }[id]!;
        expect(q.options).not.toContain(other);
      }
    }
  });

  it("builds valid tasks for every item of the new themes", () => {
    for (const themeId of ["numbers", "family"]) {
      const t = themeById(content, themeId)!;
      const pool = themeItems(t);
      for (const [i, id] of pool.entries()) {
        const item = studyItem(content, id);
        const type = item.kind === "word" ? "word-produce" : "phrase-build";
        const logic = WORD_EXERCISES[type];
        expect(logic.isApplicable(item, { content, rng: createRng(i), pool, reading: true }), id).toBe(true);
      }
      expect(planThemeLesson(content, themeId, 2, 1, TODAY).steps.length).toBeGreaterThanOrEqual(15);
    }
  });
});
