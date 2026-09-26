<script lang="ts">
  import { untrack } from "svelte";
  import { content, letterById } from "../../core/content";
  import { alphabetLessons, knownLetters, lessonLetters } from "../../core/course";
  import { createRng, stepSeed } from "../../core/random";
  import type { ExerciseId, SavedSession } from "../../core/session/types";
  import { feedbackUrl } from "../../config";
  import { EXERCISES } from "../../exercises/logic";
  import { VIEWS } from "../../exercises/registry";
  import type { CheckResult } from "../../exercises/types";
  import IntroView from "../../exercises/views/IntroView.svelte";
  import { t } from "../../i18n";
  import LetterCard from "../../ui/LetterCard.svelte";
  import ResultPanel from "../../ui/ResultPanel.svelte";
  import { currentStep, exerciseCount, exercisesDone, isFinished } from "../../session/run";
  import { chooseExercise } from "../../session/select";
  import { app } from "../state.svelte";
  import SessionResults from "./SessionResults.svelte";

  // Экран занятия (docs/09-navigation.md, 9.6–9.8): задания по одному, панель результата, выход с подтверждением.

  type Current =
    | { kind: "intro"; index: number; letter: string }
    | { kind: "exercise"; index: number; letter: string; type: Exclude<ExerciseId, "letter-intro">; question: unknown };

  let current = $state<Current | null>(null);
  let result = $state<CheckResult | null>(null);
  let finished = $state<SavedSession | null>(null);
  let cardLetter = $state<string | null>(null);
  let exitDialog = $state<HTMLDialogElement>();
  let cardDialog = $state<HTMLDialogElement>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const session = $derived(app.progress.session);
  const total = $derived(session ? exerciseCount(session) : 0);
  const done = $derived(session ? exercisesDone(session) : 0);

  /** Готовит текущий шаг. Вызывается явно, чтобы вопрос не менялся, пока показан результат. */
  function prepare() {
    const s = app.progress.session;
    if (!s) return;
    if (isFinished(s)) {
      finished = app.finishSession();
      current = null;
      return;
    }
    const step = currentStep(s)!;
    if (step.kind === "intro") {
      current = { kind: "intro", index: s.index, letter: step.letter };
      return;
    }
    const rng = createRng(stepSeed(s.seed, s.index));
    const letter = letterById(step.letter)!;
    const lessonIndex = s.lessonId ? alphabetLessons(content).findIndex((l) => l.id === s.lessonId) : -1;
    const known = knownLetters(app.progress, content);
    const focus = s.lessonId ? lessonLetters(alphabetLessons(content)[lessonIndex]!) : [...new Set(s.steps.map((st) => st.letter))];
    const scriptOpt = s.options.script ?? app.progress.settings.script;
    const script = scriptOpt === "mixed" ? rng.pick(["print", "handwriting"] as const) : scriptOpt;
    const base = { content, rng, known, focus, script, simpleKeyboard: (lessonIndex >= 0 && lessonIndex < 3) || known.length < 15, pair: step.pair, group: step.group, match: step.match };
    const choice = chooseExercise(step, letter, app.progress, base, rng, s.recent ?? []);
    const question = EXERCISES[choice.type].generate(letter, { ...base, level: choice.level });
    current = { kind: "exercise", index: s.index, letter: step.letter, type: choice.type, question };
  }

  // Первый шаг — при открытии экрана (в том числе после перезагрузки страницы посреди урока).
  $effect(() => untrack(prepare));

  // Новое занятие запущено прямо с экрана итогов («Урок 2», «Потренировать трудные») — адрес тот же,
  // поэтому переключаемся сами.
  $effect(() => {
    const s = app.progress.session;
    untrack(() => {
      if (s && finished) {
        finished = null;
        result = null;
        prepare();
      }
    });
  });

  // Только при локальной разработке: ручка для автопроверки занятий из консоли браузера.
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__session = { current: () => $state.snapshot(current), answer: (a: unknown) => onanswer(a), next, intro: introDone };
  }

  function onanswer(answer: unknown) {
    if (!current || current.kind !== "exercise" || result) return;
    const check = EXERCISES[current.type].check(current.question, answer, { content, strictness: app.progress.settings.strictness });
    result = check;
    app.answer(current.letter, check, current.type);
    if (check.verdict === "correct" && app.progress.settings.autoAdvance) timer = setTimeout(next, 1100);
  }

  function next() {
    clearTimeout(timer);
    result = null;
    prepare();
  }

  function introDone() {
    app.skipIntro();
    prepare();
  }

  function openCard(letter: string) {
    clearTimeout(timer);
    cardLetter = letter;
    cardDialog?.showModal();
  }

  // Выход: урок и повторение можно продолжить позже; тренировка и тест заканчиваются.
  const resumable = $derived(session?.kind === "lesson" || session?.kind === "review");
  function exit() {
    clearTimeout(timer);
    exitDialog?.showModal();
  }
  function leave() {
    exitDialog?.close();
    if (!resumable) app.abandonSession();
    location.hash = "#/";
  }
</script>

{#if finished}
  <SessionResults session={finished} />
{:else if session && current}
  <header class="top">
    <button class="close" onclick={exit} aria-label={t("session.exit")}>✕</button>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={done}>
      <div style:width="{total ? (done / total) * 100 : 0}%"></div>
    </div>
    <span class="count">{done}/{total}</span>
  </header>

  <div class="stage" class:with-panel={!!result}>
    {#key current.index}
      {#if current.kind === "intro"}
        <IntroView letter={letterById(current.letter)!} showIpa={app.progress.settings.showIpa} onnext={introDone} />
      {:else}
        {@const View = VIEWS[current.type]}
        <View type={current.type} question={current.question} {result} {onanswer} />
      {/if}
    {/key}
  </div>

  {#if result}
    <ResultPanel
      verdict={result.verdict}
      explanation={result.explanation}
      onnext={next}
      oncard={() => openCard(result!.letter)}
      reportHref={current.kind === "exercise" ? feedbackUrl(`${current.type} · ${current.letter}`) : null}
    />
  {/if}
{:else}
  <div class="empty">
    <p>{t("session.none")}</p>
    <a href="#/">{t("notFound.home")}</a>
  </div>
{/if}

<dialog bind:this={exitDialog} class="dialog">
  <p class="dtitle">{resumable ? t("session.exitTitle") : t("session.exitPracticeTitle")}</p>
  <p class="muted">{resumable ? t("session.exitText") : t("session.exitPracticeText")}</p>
  <div class="dactions">
    <button class="btn primary" onclick={() => exitDialog?.close()}>{t("session.stay")}</button>
    <button class="btn" onclick={leave}>{t("session.leave")}</button>
  </div>
</dialog>

<dialog bind:this={cardDialog} class="dialog card" onclose={() => (cardLetter = null)}>
  {#if cardLetter}
    {@const l = letterById(cardLetter)}
    {#if l}<LetterCard letter={l} showIpa={app.progress.settings.showIpa} />{/if}
  {/if}
  <button class="btn primary close-card" onclick={() => cardDialog?.close()}>{t("session.backToLesson")}</button>
</dialog>

<style>
  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: -12px -16px 12px;
    padding: calc(8px + env(safe-area-inset-top)) 16px 8px;
    background: var(--bg);
  }
  .close {
    width: var(--tap);
    height: var(--tap);
    margin-left: -12px;
    border: 0;
    background: none;
    color: var(--muted);
    font-size: 22px;
  }
  .bar {
    flex: 1;
    height: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--line);
  }
  .bar div {
    height: 100%;
    border-radius: 999px;
    background: var(--good);
    transition: width 0.3s;
  }
  .count {
    color: var(--muted);
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  .stage.with-panel {
    padding-bottom: 240px;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
  }
  .dialog {
    width: min(420px, calc(100vw - 32px));
    padding: 20px;
    border: 0;
    border-radius: 20px;
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .dialog::backdrop {
    background: rgba(0, 0, 0, 0.45);
  }
  .dialog.card {
    max-height: calc(100dvh - 32px);
    background: var(--bg);
  }
  .dtitle {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
  }
  .dactions {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }
  .btn {
    min-height: 52px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-weight: 600;
  }
  .btn.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-text);
  }
  .close-card {
    width: 100%;
    margin-top: 16px;
  }
</style>
