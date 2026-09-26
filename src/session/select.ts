import type { Content, Letter } from "../core/content/types";
import { boxOf } from "../core/progress/knowledge";
import type { ProgressData } from "../core/progress/types";
import type { Rng } from "../core/random";
import type { ExerciseId, Step } from "../core/session/types";
import { EXERCISES } from "../exercises/logic";
import type { ExerciseContext } from "../exercises/types";

// Выбор типа задания под уровень знания буквы (docs/03-exercises.md, «Как движок выбирает задание»).
// Сначала тренируем узнавание; когда оно обгоняет вспоминание — вспоминание.

type ExId = Exclude<ExerciseId, "letter-intro">;

/** Какие задания давать для навыка при данной коробке (индекс — коробка, последний — для всех выше). */
const BY_SKILL: Record<"recognize" | "recall", ExId[][]> = {
  recognize: [
    ["letter-to-sound", "sound-to-letter"],
    ["letter-to-sound", "sound-to-letter", "picture-to-letter"],
    ["picture-to-letter", "sound-to-letter", "letter-to-sound"],
  ],
  recall: [["ru-word-insert"], ["ru-word-insert"], ["letter-type-sound", "ru-word-insert"], ["letter-type-sound", "ru-word-insert"]],
};

export interface Choice {
  type: ExId;
  /** Уровень навыка, который тренирует задание — влияет на сложность внутри типа. */
  level: number;
}

export function chooseExercise(
  step: Extract<Step, { kind: "exercise" }>,
  letter: Letter,
  p: ProgressData,
  ctx: Omit<ExerciseContext, "level">,
  rng: Rng,
  recent: ExerciseId[],
): Choice {
  const applicable = (id: ExId) => EXERCISES[id].isApplicable(letter, { ...ctx, level: 0 });
  const rec = boxOf(p, letter.id, "recognize");
  const recall = boxOf(p, letter.id, "recall");
  const levelFor = (id: ExId) => (EXERCISES[id].skills.includes("recall") ? recall : EXERCISES[id].skills.includes("case") ? boxOf(p, letter.id, "case") : rec);

  // Типы заданы явно (тренировка, итоговый тест)
  if (step.types?.length) {
    const allowed = (step.types as ExId[]).filter(applicable);
    const type = rng.pick(allowed.length ? allowed : (["letter-to-sound"] as ExId[]));
    return { type, level: levelFor(type) };
  }

  // Изредка — дополнительный навык «заглавные ↔ строчные»
  if (rec >= 1 && rng.next() < 0.2 && applicable("case-match")) return { type: "case-match", level: levelFor("case-match") };

  const skill = rec === 0 || recall >= rec ? "recognize" : "recall";
  const box = skill === "recognize" ? rec : recall;
  const table = BY_SKILL[skill];
  let candidates = table[Math.min(box, table.length - 1)]!.filter(applicable);
  // Не больше двух одинаковых типов подряд
  const [a, b] = recent.slice(-2);
  if (a && a === b) candidates = candidates.filter((c) => c !== a).length ? candidates.filter((c) => c !== a) : candidates;
  const type = candidates.length ? rng.pick(candidates) : "letter-to-sound";
  return { type, level: levelFor(type) };
}

/** Все буквы контента по id — для построения контекста задания. */
export const letterOf = (c: Content, id: string): Letter => c.letters.find((l) => l.id === id)!;
