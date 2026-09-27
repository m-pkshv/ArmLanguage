import type { Component } from "svelte";
import type { ExerciseId, WordExerciseId } from "../core/session/types";
import ChoiceView from "./views/ChoiceView.svelte";
import ConfusableView from "./views/ConfusableView.svelte";
import MatchView from "./views/MatchView.svelte";
import MixedView from "./views/MixedView.svelte";
import PhraseBuildView from "./views/PhraseBuildView.svelte";
import WordChoiceView from "./views/WordChoiceView.svelte";
import PictureView from "./views/PictureView.svelte";
import RuInsertView from "./views/RuInsertView.svelte";
import TimedView from "./views/TimedView.svelte";
import TypeSoundView from "./views/TypeSoundView.svelte";
import WordReadingView from "./views/WordReadingView.svelte";

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
  "mixed-reading": MixedView,
  "word-type-reading": WordReadingView,
  "match-pairs": MatchView,
  "handwriting-match": ChoiceView,
  "timed-reading": TimedView,
};

// Вид заданий раздела «Первые слова» (логика — words/logic.ts).
export const WORD_VIEWS: Record<WordExerciseId, Component<any>> = {
  "word-meaning": WordChoiceView,
  "word-produce": WordChoiceView,
  "phrase-meaning": WordChoiceView,
  "phrase-build": PhraseBuildView,
};
