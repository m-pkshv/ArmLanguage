import { soundLabel } from "../checking/answer";
import { indexLetters, letterwise, lettersOf, splitLetters } from "../text/armenian";
import type { Content, ImageRef } from "./types";

// Проверка контента (docs/04-content.md, 4.8). Ошибки ломают сборку, предупреждения — нет.

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  /** Сколько слов из банка можно прочитать после каждого урока (накопительно). */
  readableAfterLesson: { lesson: string; count: number }[];
}

export interface ValidateOptions {
  fileExists: (path: string) => boolean;
  /** Режим «выпуск»: непроверенный носителем контент — ошибка. */
  release?: boolean;
  minExamples?: number;
  minReadablePerLesson?: number;
  /** В первом уроке всего 5 букв — слов из них мало, порог ниже. */
  minReadableFirstLesson?: number;
}

const stripSchwa = (s: string) => s.replace(/ы/g, "");

export function validateContent(c: Content, opts: ValidateOptions): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const minExamples = opts.minExamples ?? 3;
  const minReadable = opts.minReadablePerLesson ?? 10;
  const minReadableFirst = opts.minReadableFirstLesson ?? 5;
  const index = indexLetters(c.letters);

  const dupes = (ids: string[], what: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${what}: повторяется id «${id}»`);
      seen.add(id);
    }
  };
  dupes(c.letters.map((l) => l.id), "Буквы");
  dupes(c.words.map((w) => w.id), "Слова");
  dupes(c.ruWords.map((w) => w.id), "Русские слова");

  const wordIds = new Map(c.words.map((w) => [w.id, w]));
  const letterIds = new Set(c.letters.map((l) => l.id));

  const checkImage = (img: ImageRef | null, where: string) => {
    if (!img) return;
    if (!img.source || !img.license) errors.push(`${where}: у картинки не указаны источник или лицензия`);
    if (!opts.fileExists(img.file)) errors.push(`${where}: нет файла картинки ${img.file}`);
  };

  // --- буквы ---
  for (const l of c.letters) {
    const at = `Буква ${l.upper} (${l.id})`;
    if (!l.name.hy || !l.name.ru || !l.sound.canonical || !l.sound.ru) errors.push(`${at}: не заполнены название или звук`);
    if (l.words.length < minExamples) warnings.push(`${at}: слов-примеров ${l.words.length}, рекомендуется не меньше ${minExamples}`);
    for (const wid of l.words) {
      const w = wordIds.get(wid);
      if (!w) errors.push(`${at}: нет слова-примера «${wid}»`);
      else if (!splitLetters(w.hy).includes(l.lower)) errors.push(`${at}: в слове-примере ${w.hy} нет этой буквы`);
    }
    if (l.words.length && !l.words.some((wid) => wordIds.get(wid)?.image)) warnings.push(`${at}: ни у одного слова-примера нет картинки`);
    for (const id of [...l.confusable.sound, ...l.confusable.shape]) {
      if (!letterIds.has(id)) errors.push(`${at}: похожая буква «${id}» не найдена`);
    }
    if (l.handwriting) {
      for (const f of [l.handwriting.upper, l.handwriting.lower]) {
        if (!f) continue;
        if (!opts.fileExists(f)) errors.push(`${at}: нет файла рукописной буквы ${f}`);
      }
    }
    if (opts.release && !l.reviewed) errors.push(`${at}: не проверена носителем`);
  }

  // подписи звуков в вариантах ответа должны различаться, иначе задание «буква → звук» неоднозначно
  dupes(c.letters.map(soundLabel), "Подписи звуков");
  for (const [ru, ids] of Object.entries(c.ruHy)) {
    for (const id of ids) if (!letterIds.has(id)) errors.push(`Соответствие звуков: «${ru}» → неизвестная буква «${id}»`);
  }

  // --- слова ---
  for (const w of c.words) {
    const at = `Слово ${w.hy} (${w.id})`;
    if (!w.pronunciation || !w.ru) errors.push(`${at}: не заполнены произношение или перевод`);
    if (lettersOf(w.hy, index).some((l) => !l)) errors.push(`${at}: содержит символы не из алфавита`);
    checkImage(w.image, at);
    if (!w.exception) {
      const expected = letterwise(w.hy, index);
      if (stripSchwa(expected) !== stripSchwa(w.pronunciation)) {
        warnings.push(`${at}: произношение «${w.pronunciation}» расходится с чтением по буквам «${expected}»`);
      }
    }
    if (opts.release && !w.reviewed) errors.push(`${at}: не проверено носителем`);
  }

  for (const w of c.ruWords) checkImage(w.image, `Русское слово «${w.ru}»`);

  // --- уроки ---
  const alphabet = c.course.sections.find((s) => s.id === "alphabet");
  const readableAfterLesson: ValidationReport["readableAfterLesson"] = [];
  if (!alphabet) {
    errors.push("Курс: нет раздела «alphabet»");
  } else {
    const inLessons = new Map<string, number>();
    for (const lesson of alphabet.lessons) {
      for (const item of lesson.newItems) {
        const id = item.replace(/^letter:/, "");
        if (!letterIds.has(id)) errors.push(`Урок ${lesson.id}: неизвестная буква «${item}»`);
        inLessons.set(id, (inLessons.get(id) ?? 0) + 1);
      }
    }
    for (const l of c.letters) {
      const n = inLessons.get(l.id) ?? 0;
      if (n !== 1) errors.push(`Буква ${l.upper}: встречается в уроках ${n} раз, нужно ровно 1`);
    }

    const learned = new Set<string>();
    for (const [n, lesson] of alphabet.lessons.entries()) {
      const min = n === 0 ? minReadableFirst : minReadable;
      lesson.newItems.forEach((item) => learned.add(item.replace(/^letter:/, "")));
      const count = c.words.filter((w) => lettersOf(w.hy, index).every((l) => l && learned.has(l.id))).length;
      readableAfterLesson.push({ lesson: lesson.id, count });
      if (count < min) warnings.push(`Урок ${lesson.id}: после него можно прочитать только ${count} слов (рекомендуется от ${min})`);
    }
  }

  return { errors, warnings, readableAfterLesson };
}
