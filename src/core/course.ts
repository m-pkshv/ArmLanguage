import type { Content, Lesson, Word } from "./content/types";
import type { Day } from "./dates";
import { isSeen } from "./progress/knowledge";
import type { ProgressData } from "./progress/types";
import { indexLetters, lettersOf } from "./text/armenian";

// Уроки раздела «Алфавит»: порядок, открытие, изученные буквы (docs/09-navigation.md, 9.5).

export const letterIdOfItem = (item: string): string => item.replace(/^letter:/, "");

export function alphabetLessons(c: Content): Lesson[] {
  return c.course.sections.find((s) => s.id === "alphabet")?.lessons ?? [];
}

export const lessonLetters = (lesson: Lesson): string[] => lesson.newItems.map(letterIdOfItem);

export type LessonStatus = "done" | "current" | "locked";

export function lessonStatus(p: ProgressData, lessons: Lesson[], i: number): LessonStatus {
  const lesson = lessons[i]!;
  if (p.lessons[lesson.id]) return "done";
  if (i === 0 || p.lessons[lessons[i - 1]!.id]) return "current";
  return "locked";
}

/** Первый непройденный урок (или undefined, если пройдены все). */
export function nextLessonIndex(p: ProgressData, lessons: Lesson[]): number | undefined {
  const i = lessons.findIndex((l) => !p.lessons[l.id]);
  return i < 0 ? undefined : i;
}

/** Буквы, с которыми пользователь уже знаком: из пройденных уроков и уже встречавшиеся в заданиях. */
export function knownLetters(p: ProgressData, c: Content): string[] {
  const fromLessons = new Set(alphabetLessons(c).filter((l) => p.lessons[l.id]).flatMap(lessonLetters));
  return c.letters.filter((l) => fromLessons.has(l.id) || isSeen(p, l.id)).map((l) => l.id);
}

/** Сколько слов банка можно прочитать, зная эти буквы. */
export function readableWords(c: Content, letterIds: Iterable<string>): string[] {
  const known = new Set(letterIds);
  const index = indexLetters(c.letters);
  return c.words.filter((w) => lettersOf(w.hy, index).every((l) => l && known.has(l.id))).map((w) => w.id);
}

/** Слова, которые стало можно прочитать благодаря уроку `index` (в порядке банка слов). */
export function lessonNewWords(c: Content, lessons: Lesson[], index: number): string[] {
  const before = new Set(readableWords(c, lessons.slice(0, index).flatMap(lessonLetters)));
  return readableWords(c, lessons.slice(0, index + 1).flatMap(lessonLetters)).filter((w) => !before.has(w));
}

/** Метки служебных слов, имён и фраз — плохие примеры «что теперь можно прочитать». */
const WEAK_TAGS = ["words", "names", "phrases"];

/** Хороший пример: предмет или понятие с картинкой, читается по правилам. */
export const isGoodExample = (w: Word): boolean => !!w.image && !w.exception && !w.tags.some((t) => WEAK_TAGS.includes(t));

/**
 * Слова для показа у урока (docs/09-navigation.md, «Слова урока»): сначала хорошие примеры, среди них —
 * простые (level 1), потом короткие; при равенстве — порядок банка. Набор для урока всегда один и тот же.
 */
export function lessonWords(c: Content, lessons: Lesson[], index: number, limit: number): string[] {
  const letters = indexLetters(c.letters);
  const words = lessonNewWords(c, lessons, index).map((id, order) => {
    const w = c.words.find((x) => x.id === id)!;
    return { id, order, good: isGoodExample(w) ? 0 : 1, level: w.level, length: lettersOf(w.hy, letters).length };
  });
  words.sort((a, b) => a.good - b.good || a.level - b.level || a.length - b.length || a.order - b.order);
  return words.slice(0, limit).map((w) => w.id);
}

/** Сколько уроков пройдено сегодня (после двух — советуем закрепить завтра, docs/09-navigation.md, 9.9). */
export function lessonsDoneOn(p: ProgressData, day: Day): number {
  return Object.values(p.lessons).filter((l) => l.completedAt === day && !l.skipped).length;
}
