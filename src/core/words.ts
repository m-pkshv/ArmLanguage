import type { Content, ImageRef, Lesson, Theme } from "./content/types";
import type { Day } from "./dates";
import { alphabetLessons } from "./course";
import { boxOfItem, itemProgress } from "./progress/knowledge";
import type { ProgressData } from "./progress/types";

// Раздел «Первые слова» (docs/10-first-words.md): элементы — слова и фразы, темы, уроки, повторение.

/** Слово или фраза в едином виде: id — «word:barev», «phrase:barev-dzez». */
export interface StudyItem {
  id: string;
  kind: "word" | "phrase";
  hy: string;
  pronunciation: string;
  ru: string;
  image: ImageRef | null;
}

export const isStudyItem = (id: string): boolean => id.startsWith("word:") || id.startsWith("phrase:");

export function studyItem(c: Content, id: string): StudyItem {
  const [kind, key] = id.split(":") as ["word" | "phrase", string];
  if (kind === "word") {
    const w = c.words.find((x) => x.id === key);
    if (w) return { id, kind, hy: w.hy, pronunciation: w.pronunciation, ru: w.ru, image: w.image };
  } else {
    const p = c.phrases.find((x) => x.id === key);
    if (p) return { id, kind, hy: p.hy, pronunciation: p.pronunciation, ru: p.ru, image: null };
  }
  throw new Error(`Нет элемента «${id}»`);
}

export function themes(c: Content): Theme[] {
  return c.course.sections.find((s) => s.id === "first-words")?.themes ?? [];
}

export const themeById = (c: Content, id: string): Theme | undefined => themes(c).find((t) => t.id === id);

export const themeItems = (t: Theme): string[] => t.lessons.flatMap((l) => l.newItems);

/** Раздел открывается после 8-го (последнего) урока алфавита — решение владельца, 2026-09-28. */
export function firstWordsOpen(p: ProgressData, c: Content): boolean {
  const lessons = alphabetLessons(c);
  const last = lessons[lessons.length - 1];
  return !!last && !!p.lessons[last.id];
}

/** Уроки темы идут по порядку: открыт первый непройденный. */
export function themeLessonStatus(p: ProgressData, t: Theme, i: number): "done" | "current" | "locked" {
  const lesson = t.lessons[i]!;
  if (p.lessons[lesson.id]) return "done";
  if (i === 0 || p.lessons[t.lessons[i - 1]!.id]) return "current";
  return "locked";
}

export const themeDone = (p: ProgressData, t: Theme): boolean => t.lessons.length > 0 && t.lessons.every((l) => p.lessons[l.id]);

/** Элементы, которые уже встречались (есть прогресс хотя бы по одному навыку). */
export const seenItem = (p: ProgressData, id: string): boolean => !!(itemProgress(p, id, "meaning") || itemProgress(p, id, "produce"));

/** Слова и фразы с наступившим сроком повторения — сначала самые «просроченные». */
export function dueItems(p: ProgressData, today: Day, ids: string[]): string[] {
  const due: { id: string; due: string }[] = [];
  for (const id of ids) {
    const items = (["meaning", "produce"] as const).map((s) => itemProgress(p, id, s)).filter((x) => x && x.due <= today);
    if (items.length) due.push({ id, due: items.map((x) => x!.due).sort()[0]! });
  }
  return due.sort((a, b) => a.due.localeCompare(b.due)).map((d) => d.id);
}

/** Уровень знания слова: пока понимание ниже 2, под словом показываем чтение (решение владельца). */
export const showReading = (p: ProgressData, id: string): boolean => boxOfItem(p, id, "meaning") < 2;

export const lessonOfTheme = (c: Content, lessonId: string): { theme: Theme; lesson: Lesson; index: number } | undefined => {
  for (const t of themes(c)) {
    const index = t.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { theme: t, lesson: t.lessons[index]!, index };
  }
  return undefined;
};
