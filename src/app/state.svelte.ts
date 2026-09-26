import { content } from "../core/content";
import { alphabetLessons, lessonLetters } from "../core/course";
import { toDay } from "../core/dates";
import { applyAnswer, scheduleForReview } from "../core/progress/knowledge";
import { createEmptyProgress } from "../core/progress/schema";
import { createProgressStore } from "../core/progress/store";
import type { ProgressData, Settings } from "../core/progress/types";
import type { ExerciseId, SavedSession } from "../core/session/types";
import type { CheckResult } from "../exercises/types";
import { track } from "../platform/analytics";
import { createBrowserStorage, requestPersistentStorage } from "../platform/storage";
import { recordAnswer, score } from "../session/run";

const now = () => new Date();
export const today = () => toDay(now());
const { storage, persistent } = createBrowserStorage();
const store = createProgressStore(storage, now);

/** Итоговый тест сдан, если верно ≥ 90% (docs/02-features.md, 2.5). */
export const FINAL_PASS = 0.9;

/** Общее состояние приложения: прогресс пользователя и доступность хранилища. */
class AppState {
  progress = $state<ProgressData>(store.load());
  /** false — прогресс не сохранится после закрытия (например, режим «инкогнито»). */
  readonly storagePersistent = persistent;

  private commit() {
    store.save($state.snapshot(this.progress) as ProgressData);
  }

  updateSettings(patch: Partial<Settings>) {
    Object.assign(this.progress.settings, patch);
    this.commit();
  }

  markBackupSaved() {
    this.progress.meta.lastBackupAt = now().toISOString();
    this.commit();
  }

  replaceProgress(data: ProgressData) {
    this.progress = data;
    this.commit();
  }

  resetProgress() {
    // Настройки оформления сохраняем: сброс касается учебного прогресса.
    const settings = $state.snapshot(this.progress.settings);
    this.progress = { ...createEmptyProgress(now()), settings };
    this.commit();
  }

  // ---------- занятия ----------

  startSession(session: SavedSession) {
    this.progress.session = session;
    this.commit();
    track(`start-${session.kind}${session.lessonId ? `-${session.lessonId}` : ""}`);
    location.hash = "#/session";
  }

  /** Экран знакомства с буквой пройден. */
  skipIntro() {
    if (!this.progress.session) return;
    this.progress.session.index++;
    this.commit();
  }

  /** Ответ на задание: обновляет знания и ход занятия, сохраняет сразу (docs/09-navigation.md, 9.1). */
  answer(stepLetter: string, check: CheckResult, type: ExerciseId) {
    const s = this.progress.session;
    if (!s) return;
    s.recent = [...(s.recent ?? []).slice(-3), type];
    applyAnswer(this.progress, check, today());
    recordAnswer(s, check.verdict, stepLetter);
    this.commit();
  }

  /** Завершает занятие: отмечает урок или тест и убирает незаконченное занятие. Возвращает итоги. */
  finishSession(): SavedSession | null {
    const s = this.progress.session;
    if (!s) return null;
    const finished = $state.snapshot(s) as SavedSession;
    const day = today();
    if (s.kind === "lesson" && s.lessonId) {
      this.progress.lessons[s.lessonId] = { completedAt: day };
      track(`done-lesson-${s.lessonId}`);
    }
    if (s.kind === "final") {
      const sc = score(finished);
      const prev = this.progress.finalTest;
      this.progress.finalTest = {
        bestScore: Math.max(sc, prev?.bestScore ?? 0),
        passedAt: prev?.passedAt ?? (sc >= FINAL_PASS ? day : null),
      };
      track(sc >= FINAL_PASS ? "final-test-passed" : "final-test-failed");
    }
    this.progress.session = null;
    this.commit();
    return finished;
  }

  abandonSession() {
    this.progress.session = null;
    this.commit();
  }

  /** «Я знаю эти буквы»: открыть уроки до указанного; их буквы попадут в повторение (docs/09-navigation.md, 9.3). */
  unlockUpTo(lessonIndex: number) {
    const day = today();
    alphabetLessons(content)
      .slice(0, lessonIndex)
      .forEach((lesson) => {
        if (!this.progress.lessons[lesson.id]) {
          this.progress.lessons[lesson.id] = { completedAt: day, skipped: true };
          scheduleForReview(this.progress, lessonLetters(lesson), day);
        }
      });
    this.commit();
  }
}

export const app = new AppState();

if (persistent) void requestPersistentStorage();
