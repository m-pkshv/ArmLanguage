// Модель прогресса пользователя (см. docs/06-architecture.md, раздел 6.9).
// При любом изменении формата: увеличить SCHEMA_VERSION и добавить миграцию в schema.ts.
import type { SavedSession } from "../session/types";

export const SCHEMA_VERSION = 4;

export type Theme = "system" | "light" | "dark";
export type LetterSize = "normal" | "large";
export type Strictness = "soft" | "strict";
export type Script = "print" | "handwriting";

/** Навыки (docs/03-exercises.md, «Навыки»). Основные — recognize и recall. */
export type Skill = "recognize" | "recall" | "read" | "case" | "handwriting" | "discriminate" | "listen" | "write";

export interface Settings {
  theme: Theme;
  letterSize: LetterSize;
  autoAdvance: boolean;
  strictness: Strictness;
  showIpa: boolean;
  script: Script;
}

/** Состояние одного навыка одного элемента, ключ — "letter:tho#recall". */
export interface ItemProgress {
  box: number; // коробка интервального повторения 0–5
  due: string; // дата следующего повторения, YYYY-MM-DD
  ok: number;
  bad: number;
  last: string; // дата последнего ответа, YYYY-MM-DD
}

export interface DailyStats {
  answers: number;
  correct: number;
}

export interface LessonProgress {
  completedAt: string; // YYYY-MM-DD
  /** Урок открыт кнопкой «Я знаю эти буквы», а не пройден. */
  skipped?: boolean;
}

export interface FinalTestProgress {
  bestScore: number; // доля верных ответов 0–1
  passedAt: string | null; // YYYY-MM-DD, когда впервые сдан на ≥ 90%
  /** Лучшее чтение на время (часть 2, V2): верно прочитано слов и среднее время на слово. */
  bestReading: { correct: number; avgMs: number } | null;
}

/** Рекорд мини-игры «Найди пары»: лучшее время раунда без ошибок. */
export interface GameRecord {
  bestMs: number;
  at: string; // YYYY-MM-DD
}

export interface ProgressData {
  schemaVersion: typeof SCHEMA_VERSION;
  createdAt: string; // ISO-время
  items: Record<string, ItemProgress>;
  lessons: Record<string, LessonProgress>;
  confusions: Record<string, number>; // "letter:tho>letter:tyun" → число путаниц
  daily: Record<string, DailyStats>; // ключ — YYYY-MM-DD
  settings: Settings;
  /** Незаконченное занятие — чтобы продолжить с того же места (docs/09-navigation.md, 9.8). */
  session: SavedSession | null;
  finalTest: FinalTestProgress | null;
  /** Рекорды «Найди пары», ключ — вид пар (sound, case, handwriting). */
  games: Record<string, GameRecord>;
  meta: {
    lastBackupAt: string | null; // когда в последний раз сохраняли резервную копию
  };
}
