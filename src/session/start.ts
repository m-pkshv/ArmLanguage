import { content } from "../core/content";
import { knownLetters } from "../core/course";
import type { ExerciseId, SessionOptions } from "../core/session/types";
import { app, today } from "../app/state.svelte";
import { planFinalTest, planLesson, planLetter, planMixed, planPairs, planPractice, planReview, planWords } from "./plan";

// Запуск занятий из экранов приложения.

const seed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export function startLesson(index: number) {
  app.startSession(planLesson(content, app.progress, index, seed(), today()));
}

export function startReview() {
  app.startSession(planReview(app.progress, knownLetters(app.progress, content), seed(), today()));
}

export function startPractice(letters: string[], types: ExerciseId[], length: number, script: SessionOptions["script"]) {
  app.startSession(planPractice(app.progress, letters, types, length, script, seed(), today()));
}

export function startLetterPractice(letterId: string) {
  app.startSession(planLetter(content, letterId, knownLetters(app.progress, content), seed(), today()));
}

export function startMixed() {
  app.startSession(planMixed(content, knownLetters(app.progress, content), seed(), today()));
}

export function startWords() {
  app.startSession(planWords(content, knownLetters(app.progress, content), seed(), today()));
}

export function startPairs(groups: { letters: string[] }[]) {
  app.startSession(planPairs(groups, seed(), today()));
}

export function startFinalTest() {
  app.startSession(planFinalTest(content, seed(), today()));
}
