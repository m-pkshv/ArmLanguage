// Модель прогресса пользователя (см. docs/06-architecture.md, раздел 6.9).
// При любом изменении формата: увеличить SCHEMA_VERSION и добавить миграцию в schema.ts.

export const SCHEMA_VERSION = 1;

export type Theme = "system" | "light" | "dark";
export type LetterSize = "normal" | "large";
export type Strictness = "soft" | "strict";
export type Script = "print" | "handwriting";

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

export interface ProgressData {
  schemaVersion: typeof SCHEMA_VERSION;
  createdAt: string; // ISO-время
  items: Record<string, ItemProgress>;
  lessons: Record<string, { completedAt: string }>;
  confusions: Record<string, number>; // "letter:tho>letter:tyun" → число путаниц
  daily: Record<string, DailyStats>; // ключ — YYYY-MM-DD
  settings: Settings;
  meta: {
    lastBackupAt: string | null; // когда в последний раз сохраняли резервную копию
  };
}
