import { content } from "../core/content";
import { knownLetters } from "../core/course";
import type { ExerciseId, MatchKind, SessionOptions } from "../core/session/types";
import { dueStudyItems } from "../core/words";
import { app, today } from "../app/state.svelte";
import { planFinalTest, planLesson, planLetter, planMixed, planPairs, planPractice, planHandwriting, planMatch, planReview, planWords } from "./plan";

import { planThemeLesson, planThemeTest, planWordsReview } from "./wordPlan";

// Запуск занятий из экранов приложения.

const seed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export function startLesson(index: number) {
  app.startSession(planLesson(content, app.progress, index, seed(), today()));
}

export function startReview() {
  app.startSession(planReview(app.progress, knownLetters(app.progress, content), seed(), today(), dueStudyItems(content, app.progress, today())));
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

export function startMatch(kind: MatchKind) {
  app.startSession(planMatch(app.progress, knownLetters(app.progress, content), kind, seed(), today()));
}

export function startHandwriting() {
  app.startSession(planHandwriting(app.progress, knownLetters(app.progress, content), seed(), today()));
}

export function startPairs(groups: { letters: string[] }[]) {
  app.startSession(planPairs(groups, seed(), today()));
}

export function startFinalTest() {
  app.startSession(planFinalTest(content, seed(), today()));
}

// Раздел «Первые слова» (docs/10-first-words.md)
export function startThemeLesson(themeId: string, index: number) {
  app.startSession(planThemeLesson(content, themeId, index, seed(), today()));
}

export function startThemeTest(themeId: string) {
  app.startSession(planThemeTest(content, themeId, seed(), today()));
}

export function startWordsReview() {
  app.startSession(planWordsReview(content, app.progress, seed(), today()));
}
