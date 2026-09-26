import type { Component } from "svelte";
import type { ExerciseId } from "../core/session/types";
import ChoiceView from "./views/ChoiceView.svelte";
import ConfusableView from "./views/ConfusableView.svelte";
import PictureView from "./views/PictureView.svelte";
import RuInsertView from "./views/RuInsertView.svelte";
import TypeSoundView from "./views/TypeSoundView.svelte";

// Вид каждого типа задания. Логика — в logic.ts. Все виды получают одинаковые свойства.
export interface ViewProps {
  type: ExerciseId;
  question: any;
  result: import("./types").CheckResult | null;
  onanswer: (answer: any) => void;
}

export const VIEWS: Record<Exclude<ExerciseId, "letter-intro">, Component<any>> = {
  "letter-to-sound": ChoiceView,
  "sound-to-letter": ChoiceView,
  "case-match": ChoiceView,
  "picture-to-letter": PictureView,
  "letter-type-sound": TypeSoundView,
  "ru-word-insert": RuInsertView,
  "confusable-pair": ConfusableView,
};
