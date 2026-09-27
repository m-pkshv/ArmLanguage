// Занятие (сессия заданий): урок, повторение, тренировка, итоговый тест.

export type ExerciseId =
  | "letter-intro" // E01
  | "letter-to-sound" // E02
  | "sound-to-letter" // E03
  | "picture-to-letter" // E04
  | "letter-type-sound" // E06
  | "ru-word-insert" // E08
  | "case-match" // E15
  | "confusable-pair" // E10
  | "mixed-reading" // E09
  | "word-type-reading" // E07
  | "match-pairs" // E05
  | "handwriting-match" // E11
  | "timed-reading"; // чтение слов на время в итоговом тесте

/** Вид пар в мини-игре «Найди пары» (E05). */
export type MatchKind = "sound" | "case" | "handwriting";

export type SessionKind = "lesson" | "review" | "practice" | "final" | "letter" | "pairs" | "mixed" | "words" | "match" | "handwriting";

export type Step =
  | { kind: "intro"; letter: string }
  | {
      kind: "exercise";
      letter: string;
      /** Ограничить выбор типов (тренировка, итоговый тест). Иначе тип выбирает движок по уровню знания. */
      types?: ExerciseId[];
      /** Повтор задания после ошибки. */
      retry?: boolean;
      /** Тренажёр пар-ловушек: с какими буквами сравнивать (иначе — любая знакомая «пара»). */
      pair?: string[];
      /** «Найди пары»: буквы для поля (иначе — знакомые) и вид пар. */
      group?: string[];
      match?: MatchKind;
      /** Итоговый тест, часть 2: какое слово читать и его номер. */
      reading?: ReadingStep;
    };

export interface ReadingStep {
  word: string;
  n: number; // номер слова, с 1
  total: number;
}

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
  /** Типы последних заданий — чтобы не давать один тип много раз подряд и повторить тот же выбор после перезагрузки. */
  recent?: ExerciseId[];
  /** Итоговый тест, часть 2: сколько слов прочитано верно и сколько всего ушло времени. */
  reading?: { correct: number; total: number; ms: number };
}
