// Занятие (сессия заданий): урок, повторение, тренировка, итоговый тест.

export type ExerciseId =
  | "letter-intro" // E01
  | "letter-to-sound" // E02
  | "sound-to-letter" // E03
  | "picture-to-letter" // E04
  | "letter-type-sound" // E06
  | "ru-word-insert" // E08
  | "case-match"; // E15

export type SessionKind = "lesson" | "review" | "practice" | "final" | "letter";

export type Step =
  | { kind: "intro"; letter: string }
  | {
      kind: "exercise";
      letter: string;
      /** Ограничить выбор типов (тренировка, итоговый тест). Иначе тип выбирает движок по уровню знания. */
      types?: ExerciseId[];
      /** Повтор задания после ошибки. */
      retry?: boolean;
    };

export interface SessionResult {
  correct: number;
  partial: number;
  wrong: number;
  wrongByLetter: Record<string, number>;
}

export interface SessionOptions {
  script?: "print" | "handwriting" | "mixed";
  /** Возвращать ли задания с ошибкой в конец (в итоговом тесте — нет). */
  retries?: boolean;
}

export interface SavedSession {
  kind: SessionKind;
  lessonId?: string;
  letterId?: string;
  seed: number;
  steps: Step[];
  index: number; // текущий шаг
  result: SessionResult;
  options: SessionOptions;
  startedAt: string; // YYYY-MM-DD
}
