<script lang="ts">
  import { content, letterById, wordById } from "../../core/content";
  import { alphabetLessons, knownLetters, lessonLetters, lessonsDoneOn, nextLessonIndex, readableWords } from "../../core/course";
  import type { SavedSession } from "../../core/session/types";
  import { t } from "../../i18n";
  import { finalPassed, READING_MAX_AVG_MS, READING_MIN_CORRECT, readingResult, score } from "../../session/run";
  import { isStudyItem, lessonOfTheme, studyItem, themeById, themeDone } from "../../core/words";
  import { THEME_PASS } from "../../session/wordPlan";
  import { startFinalTest, startLesson, startPractice, startThemeLesson, startThemeTest } from "../../session/start";
  import { app, FINAL_PASS, today } from "../state.svelte";
  import ConfusionHint from "./ConfusionHint.svelte";

  // Итоги занятия и что дальше (docs/09-navigation.md, 9.9).
  let { session }: { session: SavedSession } = $props();

  const lessons = alphabetLessons(content);
  const lessonIndex = $derived(session.lessonId ? lessons.findIndex((l) => l.id === session.lessonId) : -1);
  const r = $derived(session.result);
  const answered = $derived(r.correct + r.partial + r.wrong);
  const pct = $derived(Math.round(score(session) * 100));
  // ошибки по буквам и отдельно — по словам и фразам «Первых слов»
  const wrong = $derived(Object.entries(r.wrongByLetter).sort((a, b) => b[1] - a[1]));
  const hard = $derived(wrong.filter(([id]) => !isStudyItem(id)).map(([id, n]) => ({ letter: letterById(id)!, n })));
  const hardWords = $derived(wrong.filter(([id]) => isStudyItem(id)).map(([id, n]) => ({ item: studyItem(content, id), n })));
  const themeInfo = $derived(session.lessonId ? lessonOfTheme(content, session.lessonId) : undefined);
  const themeOfTest = $derived(session.themeId ? themeById(content, session.themeId) : undefined);
  const nextThemeLesson = $derived(
    themeInfo && themeInfo.index + 1 < themeInfo.theme.lessons.length ? themeInfo.index + 1 : undefined,
  );
  const themePassed = $derived(session.kind === "theme-test" && score(session) >= THEME_PASS);
  const readable = $derived(readableWords(content, knownLetters(app.progress, content)));
  const sample = $derived(readable.slice(-4).map((id) => wordById(id)!));
  const nextIndex = $derived(nextLessonIndex(app.progress, lessons));
  // После двух уроков за день советуем закрепить завтра, но не запрещаем.
  const tired = $derived(lessonsDoneOn(app.progress, today()) >= 2);
  const passed = $derived(session.kind === "final" && finalPassed(session));
  const reading = $derived(readingResult(session));
  const secs = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",");

  const title = $derived(
    session.kind === "theme-lesson"
      ? t("words.lessonDone")
      : session.kind === "theme-test"
        ? themePassed
          ? t("words.testPassed")
          : t("words.testFailed")
        : session.kind === "words-review"
          ? t("words.reviewDone")
          : session.kind === "lesson"
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
                : session.kind === "match"
                  ? t("results.matchDone")
                  : session.kind === "handwriting"
                    ? t("results.handwritingDone")
                    : t("results.practiceDone"),
  );
  const themeHref = $derived(`#/words/${themeInfo?.theme.id ?? session.themeId ?? ""}`);

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
  <div class="emoji" aria-hidden="true">{(session.kind === "final" && !passed) || (session.kind === "theme-test" && !themePassed) ? "💪" : "🎉"}</div>
  <h1>{title}</h1>

  {#if session.kind === "lesson" && lessonIndex >= 0}
    <div class="letters hy" lang="hy">{lessonLetters(lessons[lessonIndex]!).map((id) => letterById(id)!.upper).join(" ")}</div>
  {/if}

  {#if session.kind === "theme-test"}
    <p class="big">{pct}%</p>
    {#if !themePassed}<p class="muted">{t("words.testFailedText", { pct: THEME_PASS * 100 })}</p>{/if}
  {:else if session.kind === "final"}
    <p class="big">{pct}%</p>
    <p class="stat">{t("results.finalTasks", { correct: r.correct + r.partial, total: answered, pct })}</p>
    {#if reading}
      <p class="stat">{t("results.finalReading", { correct: reading.correct, total: reading.total, s: secs(reading.avgMs) })}</p>
    {/if}
    {#if passed}
      <p class="muted">{t("results.finalPassedText")}</p>
    {:else}
      <!-- Чего не хватило для зачёта (docs/02-features.md, 2.5) -->
      {#if score(session) < FINAL_PASS}<p class="muted">{t("results.finalNeedTasks", { need: Math.round(FINAL_PASS * 100) })}</p>{/if}
      {#if reading && reading.correct < READING_MIN_CORRECT}<p class="muted">{t("results.finalNeedCorrect", { need: READING_MIN_CORRECT })}</p>{/if}
      {#if reading && reading.avgMs > READING_MAX_AVG_MS}<p class="muted">{t("results.finalNeedSpeed", { s: READING_MAX_AVG_MS / 1000 })}</p>{/if}
      <p class="muted">{t("results.finalFailedText")}</p>
    {/if}
  {:else}
    <p class="stat">{t("results.score", { correct: r.correct + r.partial, total: answered })}</p>
  {/if}

  {#if session.kind === "lesson"}
    <section class="box">
      <p>{t("results.canRead", { n: readable.length })}</p>
      <p class="hy words" lang="hy">{sample.map((w) => w.hy).join(" · ")}</p>
    </section>
  {/if}

  {#if hardWords.length}
    <section class="box">
      <p>{t("words.hard")}</p>
      <p class="hard">
        {#each hardWords as h (h.item.id)}<span><span class="hy" lang="hy">{h.item.hy}</span> <span class="muted">— {h.item.ru}</span></span>{/each}
      </p>
    </section>
  {/if}

  {#if hard.length}
    <section class="box">
      <p>{t("results.hard")}</p>
      <p class="hard">
        {#each hard as h (h.letter.id)}
          <a href="#/alphabet/{h.letter.id}"><span class="hy" lang="hy">{h.letter.id === "yev" ? h.letter.lower : h.letter.upper}</span> <span class="muted">×{h.n}</span></a>
        {/each}
      </p>
    </section>
  {/if}

  {#if hard.length && session.kind !== "pairs"}
    <ConfusionHint only={hard.map((h) => h.letter.id)} />
  {/if}

  <div class="actions">
    {#if session.kind === "theme-lesson" && themeInfo}
      {#if nextThemeLesson !== undefined && !app.progress.lessons[themeInfo.theme.lessons[nextThemeLesson]!.id]}
        <button class="btn primary" onclick={() => startThemeLesson(themeInfo.theme.id, nextThemeLesson!)}>
          {t("words.nextLesson", { n: nextThemeLesson + 1, title: themeInfo.theme.lessons[nextThemeLesson]!.title })}
        </button>
      {:else if themeDone(app.progress, themeInfo.theme) && !app.progress.themeTests[themeInfo.theme.id]?.passedAt}
        <button class="btn primary" onclick={() => startThemeTest(themeInfo.theme.id)}>{t("words.toTest")}</button>
      {/if}
      <a class="btn" href={themeHref}>{t("words.toTheme")}</a>
    {:else if session.kind === "theme-test" && themeOfTest}
      {#if !themePassed}<button class="btn primary" onclick={() => startThemeTest(themeOfTest.id)}>{t("results.retryFinal")}</button>{/if}
      <a class="btn" class:primary={themePassed} href={themeHref}>{t("words.toTheme")}</a>
    {:else if session.kind === "words-review"}
      <a class="btn primary" href="#/words">{t("words.title")}</a>
    {:else if session.kind === "lesson" && nextIndex !== undefined && !tired}
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
  /* Главная кнопка: нажата и неактивна — явными цветами, без прозрачности (docs/11-design.md) */
  .btn.primary:active:not(:disabled) {
    border-color: var(--accent-pressed);
    background: var(--accent-pressed);
  }
  .btn.primary:disabled {
    border-color: transparent;
    background: var(--surface-2);
    color: var(--muted);
    opacity: 1;
  }
</style>
