import { boxOfItem } from "../core/progress/knowledge";
import type { ProgressData } from "../core/progress/types";
import type { Rng } from "../core/random";
import type { ExerciseId, Step, WordExerciseId } from "../core/session/types";
import type { StudyItem } from "../core/words";
import { WORD_EXERCISES, type WordContext } from "../exercises/words/logic";

// Выбор задания для слова или фразы (docs/10-first-words.md, 10.6): сначала понимание (армянское → смысл),
// когда оно обгоняет вспоминание — вспоминание (смысл → армянское). Один тип — не больше двух раз подряд.

const BY_KIND: Record<StudyItem["kind"], { meaning: WordExerciseId; produce: WordExerciseId }> = {
  word: { meaning: "word-meaning", produce: "word-produce" },
  phrase: { meaning: "phrase-meaning", produce: "phrase-build" },
};

export function chooseWordExercise(
  step: Extract<Step, { kind: "exercise" }>,
  item: StudyItem,
  p: ProgressData,
  ctx: WordContext,
  rng: Rng,
  recent: (ExerciseId | WordExerciseId)[],
): WordExerciseId {
  const applicable = (id: WordExerciseId) => WORD_EXERCISES[id].isApplicable(item, ctx);
  const own = BY_KIND[item.kind];
  const explicit = (step.types ?? []).filter((x): x is WordExerciseId => x in WORD_EXERCISES).filter(applicable);
  if (explicit.length) return rng.pick(explicit);

  const meaning = boxOfItem(p, item.id, "meaning");
  const produce = boxOfItem(p, item.id, "produce");
  const spell = boxOfItem(p, item.id, "spell");
  // написание — когда слово уже вспоминают: сначала из карточек (W05), потом на клавиатуре (W06)
  const spellType: WordExerciseId = spell >= 2 ? "word-write" : "word-build";
  // у фраз вспоминание — «собери фразу» или ситуация «что вы скажете?» (W09), по очереди
  const produceType: WordExerciseId = item.kind === "phrase" && rng.next() < 0.5 ? "phrase-situation" : own.produce;
  let order: WordExerciseId[] =
    meaning === 0
      ? [own.meaning]
      : produce < meaning
        ? [produceType, own.produce, own.meaning]
        : item.kind === "word" && produce >= 1 && spell < produce
          ? [spellType, own.produce, own.meaning]
          : [own.meaning, produceType, own.produce];
  if (meaning > 0 && produce >= meaning && spell >= produce && rng.next() < 0.5) order = order.reverse();
  const [a, b] = recent.slice(-2);
  if (a && a === b) order = [...order.filter((x) => x !== a), ...order.filter((x) => x === a)];
  return order.find(applicable) ?? own.meaning;
}
