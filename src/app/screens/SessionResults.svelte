<script lang="ts">
  import { content, letterById, wordById } from "../../core/content";
  import { alphabetLessons, knownLetters, lessonLetters, lessonsDoneOn, nextLessonIndex, readableWords } from "../../core/course";
  import type { SavedSession } from "../../core/session/types";
  import { t } from "../../i18n";
  import { score } from "../../session/run";
  import { startFinalTest, startLesson, startPractice } from "../../session/start";
  import { app, FINAL_PASS, today } from "../state.svelte";
  import ConfusionHint from "./ConfusionHint.svelte";

  // Итоги занятия и что дальше (docs/09-navigation.md, 9.9).
  let { session }: { session: SavedSession } = $props();

  const lessons = alphabetLessons(content);
  const lessonIndex = $derived(session.lessonId ? lessons.findIndex((l) => l.id === session.lessonId) : -1);
  const r = $derived(session.result);
  const answered = $derived(r.correct + r.partial + r.wrong);
  const pct = $derived(Math.round(score(session) * 100));
  const hard = $derived(
    Object.entries(r.wrongByLetter)
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => ({ letter: letterById(id)!, n })),
  );
  const readable = $derived(readableWords(content, knownLetters(app.progress, content)));
  const sample = $derived(readable.slice(-4).map((id) => wordById(id)!));
  const nextIndex = $derived(nextLessonIndex(app.progress, lessons));
  // После двух уроков за день советуем закрепить завтра, но не запрещаем.
  const tired = $derived(lessonsDoneOn(app.progress, today()) >= 2);
  const passed = $derived(session.kind === "final" && score(session) >= FINAL_PASS);

  const title = $derived(
    session.kind === "lesson"
      ? t("results.lessonDone", { n: lessonIndex + 1 })
      : session.kind === "final"
        ? passed
          ? t("results.finalPassed")
          : t("results.finalFailed")
        : session.kind === "review"
          ? t("results.reviewDone")
          : session.kind === "pairs"
            ? t("results.pairsDone")
            : session.kind === "mixed"
              ? t("results.mixedDone")
              : session.kind === "words"
                ? t("results.wordsDone")
                : t("results.practiceDone"),
  );

  function practiceHard() {
    startPractice(
      hard.map((h) => h.letter.id),
      ["letter-to-sound", "sound-to-letter", "letter-type-sound", "picture-to-letter"],
      Math.min(12, hard.length * 3),
      undefined,
    );
  }
</script>

<div class="results">
  <div class="emoji" aria-hidden="true">{session.kind === "final" && !passed ? "💪" : "🎉"}</div>
  <h1>{title}</h1>

  {#if session.kind === "lesson" && lessonIndex >= 0}
    <div class="letters hy" lang="hy">{lessonLetters(lessons[lessonIndex]!).map((id) => letterById(id)!.upper).join(" ")}</div>
  {/if}

  {#if session.kind === "final"}
    <p class="big">{pct}%</p>
    <p class="muted">{passed ? t("results.finalPassedText") : t("results.finalFailedText", { need: Math.round(FINAL_PASS * 100) })}</p>
  {:else}
    <p class="stat">{t("results.score", { correct: r.correct + r.partial, total: answered })}</p>
  {/if}

  {#if session.kind === "lesson"}
    <section class="box">
      <p>{t("results.canRead", { n: readable.length })}</p>
      <p class="hy words" lang="hy">{sample.map((w) => w.hy).join(" · ")}</p>
    </section>
  {/if}

  {#if hard.length}
    <section class="box">
      <p>{t("results.hard")}</p>
      <p class="hard">
        {#each hard as h (h.letter.id)}
          <a href="#/alphabet/{h.letter.id}"><span class="hy" lang="hy">{h.letter.upper}</span> <span class="muted">×{h.n}</span></a>
        {/each}
      </p>
    </section>
  {/if}

  {#if hard.length && session.kind !== "pairs"}
    <ConfusionHint only={hard.map((h) => h.letter.id)} />
  {/if}

  <div class="actions">
    {#if session.kind === "lesson" && nextIndex !== undefined && !tired}
      <button class="btn primary" onclick={() => startLesson(nextIndex)}>
        {t("results.nextLesson", { n: nextIndex + 1, letters: lessonLetters(lessons[nextIndex]!).map((id) => letterById(id)!.upper).join(" ") })}
      </button>
      <a class="btn" href="#/">{t("results.home")}</a>
    {:else if session.kind === "final" && !passed}
      <button class="btn primary" onclick={startFinalTest}>{t("results.retryFinal")}</button>
      <a class="btn" href="#/">{t("results.home")}</a>
    {:else}
      <a class="btn primary" href="#/">{t("results.home")}</a>
      {#if session.kind === "lesson" && nextIndex !== undefined && tired}
        <p class="muted small">{t("results.tomorrow")}</p>
        <button class="link" onclick={() => startLesson(nextIndex)}>{t("results.nextLessonAnyway", { n: nextIndex + 1 })}</button>
      {/if}
    {/if}
    {#if hard.length && session.kind !== "final"}
      <button class="link" onclick={practiceHard}>{t("results.practiceHard")}</button>
    {/if}
  </div>
</div>

<style>
  .results {
    padding: 24px 0 8px;
    text-align: center;
  }
  .emoji {
    font-size: 48px;
  }
  h1 {
    margin: 8px 0 4px;
    font-size: 26px;
  }
  .letters {
    color: var(--accent);
    font-size: 32px;
    letter-spacing: 0.1em;
  }
  .stat {
    margin: 8px 0 16px;
    font-size: 18px;
  }
  .big {
    margin: 8px 0 0;
    color: var(--accent);
    font-size: 56px;
    font-weight: 700;
  }
  .box {
    margin: 12px 0;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    text-align: left;
  }
  .box p {
    margin: 0;
  }
  .words {
    margin-top: 6px !important;
    font-size: 20px;
  }
  .hard {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-top: 8px !important;
  }
  .hard a {
    color: var(--text);
    font-size: 24px;
    text-decoration: none;
  }
  .hard .muted {
    font-size: 15px;
  }
  .actions {
    display: grid;
    gap: 10px;
    margin-top: 20px;
  }
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
  }
  .btn.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-text);
  }
  .link {
    padding: 8px;
    border: 0;
    background: none;
    color: var(--accent);
    text-decoration: underline;
  }
  .small {
    margin: 0;
    font-size: 14px;
  }
</style>
