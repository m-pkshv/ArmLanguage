// Учебный контент приложения: данные из папки content/ (см. docs/04-content.md).
import lettersJson from "../../../content/alphabet/letters.json";
import courseJson from "../../../content/course.json";
import phrasesJson from "../../../content/phrases/phrases.json";
import ruHyJson from "../../../content/rules/ru-hy.json";
import ruPhrasesJson from "../../../content/ru/phrases.json";
import ruWordsJson from "../../../content/ru/words.json";
import wordsJson from "../../../content/words/words.json";
import type { Content, Course, Letter, Phrase, RuHyRules, RuPhrase, RuWord, Word } from "./types";

export const content: Content = {
  letters: lettersJson as Letter[],
  words: wordsJson as Word[],
  ruWords: ruWordsJson as RuWord[],
  ruPhrases: ruPhrasesJson as RuPhrase[],
  phrases: phrasesJson as Phrase[],
  course: courseJson as Course,
  ruHy: ruHyJson as RuHyRules,
};

export const LETTERS = content.letters;

const lettersById = new Map(content.letters.map((l) => [l.id, l]));
const wordsById = new Map(content.words.map((w) => [w.id, w]));

export const letterById = (id: string): Letter | undefined => lettersById.get(id);
export const wordById = (id: string): Word | undefined => wordsById.get(id);

/** Адрес файла из контента (картинки, рукописные буквы) с учётом адреса сайта. */
export const assetUrl = (file: string): string => `${import.meta.env.BASE_URL}${file}`;
