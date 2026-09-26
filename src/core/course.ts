import type { Content, Lesson } from "./content/types";
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

/** Сколько уроков пройдено сегодня (после двух — советуем закрепить завтра, docs/09-navigation.md, 9.9). */
export function lessonsDoneOn(p: ProgressData, day: Day): number {
  return Object.values(p.lessons).filter((l) => l.completedAt === day && !l.skipped).length;
}
