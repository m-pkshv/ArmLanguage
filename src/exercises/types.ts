import type { Content, Letter } from "../core/content/types";
import type { Effect } from "../core/progress/knowledge";
import type { Verdict } from "../core/progress/srs";
import type { Skill, Strictness } from "../core/progress/types";
import type { Rng } from "../core/random";
import type { ExerciseId } from "../core/session/types";

// Интерфейс типа задания (docs/06-architecture.md, 6.7). Логика — чистые функции без интерфейса,
// вид — отдельный компонент View.svelte, связываются в registry.ts.

export interface ExerciseContext {
  content: Content;
  rng: Rng;
  /** Буквы, с которыми пользователь уже знаком (для неправильных вариантов ответа). */
  known: string[];
  /** Буквы текущего занятия. */
  focus: string[];
  script: "print" | "handwriting";
  /** Уровень навыка, который тренирует задание (коробка 0–5): влияет на сложность внутри типа. */
  level: number;
  /** Упрощённая экранная клавиатура (первые уроки). */
  simpleKeyboard: boolean;
  /** Тренажёр пар-ловушек: с какими буквами сравнивать. */
  pair?: string[];
}

export interface CheckContext {
  content: Content;
  strictness: Strictness;
}

export interface Explanation {
  /** Главная строка: «Верно! Ձ — дза» / «Правильно: Թ — тх». */
  title: string;
  /** Дополнительные пояснения: чем отличается выбранный вариант, про придыхание и т. п. */
  lines: string[];
}

export interface CheckResult {
  verdict: Verdict;
  effects: Effect[];
  confusions: [expected: string, given: string][];
  explanation: Explanation;
  /** Буква, чью карточку предлагать открыть из панели результата. */
  letter: string;
  /** Подробности для вида задания (например, разбор слова по буквам в E07). */
  detail?: unknown;
}

export interface ExerciseLogic<Q = unknown, A = unknown> {
  id: ExerciseId;
  skills: Skill[];
  isApplicable(letter: Letter, ctx: ExerciseContext): boolean;
  generate(letter: Letter, ctx: ExerciseContext): Q;
  check(question: Q, answer: A, ctx: CheckContext): CheckResult;
}
