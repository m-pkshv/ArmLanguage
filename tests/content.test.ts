// Проверка учебного контента: запускается в `npm test` и отдельно `npm run check:content`.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { content } from "../src/core/content";
import { validateContent } from "../src/core/content/validate";
import { indexLetters, letterwise, splitLetters } from "../src/core/text/armenian";

const publicDir = join(import.meta.dirname, "..", "public");

describe("content", () => {
  const report = validateContent(content, {
    fileExists: (f) => existsSync(join(publicDir, f)),
    release: process.env.CONTENT_RELEASE === "1",
  });

  it("has no errors", () => {
    expect(report.errors).toEqual([]);
  });

  it("prints warnings and lesson stats", () => {
    for (const w of report.warnings) console.warn("⚠", w);
    console.info(report.readableAfterLesson.map((r) => `${r.lesson}: ${r.count} слов`).join(" · "));
    expect(report.readableAfterLesson).toHaveLength(8);
  });
});

describe("armenian text", () => {
  const index = indexLetters(content.letters);

  it("splits ու and և as single letters", () => {
    expect(splitLetters("Հայաստան")).toEqual(["հ", "ա", "յ", "ա", "ս", "տ", "ա", "ն"]);
    expect(splitLetters("ձուկ")).toEqual(["ձ", "ու", "կ"]);
    expect(splitLetters("բարև")).toEqual(["բ", "ա", "ր", "և"]);
  });

  it("reads letter by letter with word-initial rules", () => {
    expect(letterwise("խնձոր", index)).toBe("хндзор");
    expect(letterwise("երեխա", index)).toBe("йереха");
    expect(letterwise("ոզնի", index)).toBe("возни");
    expect(letterwise("կով", index)).toBe("ков");
    expect(letterwise("Երևան", index)).toBe("йереван");
  });
});
