import type { ExerciseId } from "../core/session/types";
import { caseMatch, handwritingMatch, letterToSound, soundToLetter } from "./choice";
import { confusablePair } from "./confusable";
import { matchPairs } from "./matchPairs";
import { mixedReading } from "./mixedReading";
import { pictureToLetter } from "./picture";
import { ruWordInsert } from "./ruWordInsert";
import type { ExerciseLogic } from "./types";
import { typeSound } from "./typeSound";
import { wordReading } from "./wordReading";

// Реестр логики заданий. Чтобы добавить тип: логика здесь, вид — в registry.ts (docs/06-architecture.md, 6.7).
export const EXERCISES: Record<Exclude<ExerciseId, "letter-intro">, ExerciseLogic<any, any>> = {
  "letter-to-sound": letterToSound,
  "sound-to-letter": soundToLetter,
  "picture-to-letter": pictureToLetter,
  "case-match": caseMatch,
  "ru-word-insert": ruWordInsert,
  "letter-type-sound": typeSound,
  "confusable-pair": confusablePair,
  "mixed-reading": mixedReading,
  "word-type-reading": wordReading,
  "match-pairs": matchPairs,
  "handwriting-match": handwritingMatch,
};
