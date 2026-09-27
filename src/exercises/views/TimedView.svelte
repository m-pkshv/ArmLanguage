<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { wordById } from "../../core/content";
  import { t } from "../../i18n";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import { READING_MAX_AVG_MS, READING_MIN_CORRECT } from "../../session/run";
  import type { TimedAnswer, TimedQuestion } from "../timedReading";
  import type { CheckResult } from "../types";

  // Итоговый тест, часть 2: чтение на время. Перед первым словом — экран «Часть 2», время идёт после «Начать».
  let { question, result, onanswer }: { question: TimedQuestion; result: CheckResult | null; onanswer: (a: TimedAnswer) => void } = $props();

  const word = $derived(wordById(question.word)!);
  // Вид создаётся заново на каждое слово, поэтому номер слова читаем один раз
  let started = $state<number | null>(untrack(() => question.n) === 1 ? null : Date.now());
  let now = $state(Date.now());
  let chosen = $state<number | null>(null);
  let stopped = $state<number | null>(null);
  const tick = setInterval(() => (now = Date.now()), 100);
  onDestroy(() => clearInterval(tick));

  const elapsed = $derived(started === null ? 0 : (stopped ?? now) - started);

  function pick(i: number) {
    if (started === null || result) return;
    stopped = Date.now();
    chosen = i;
    onanswer({ value: question.options[i]!, ms: stopped - started });
  }
</script>

{#if started === null}
  <div class="intro">
    <p class="part">{t("session.timedPart")}</p>
    <h2>{t("session.timedTitle", { n: question.total })}</h2>
    <p class="muted">{t("session.timedText", { need: READING_MIN_CORRECT, total: question.total, s: READING_MAX_AVG_MS / 1000 })}</p>
    <button class="start" onclick={() => (started = Date.now())}>{t("session.timedStart")}</button>
  </div>
{:else}
  <div class="head">
    <span class="muted">{t("session.timedWord", { n: question.n, total: question.total })}</span>
    <span class="clock" class:slow={elapsed > READING_MAX_AVG_MS}>⏱ {(elapsed / 1000).toFixed(1).replace(".", ",")}</span>
  </div>
  <div class="word hy" lang="hy">{word.hy}</div>
  <p class="q">{t("session.timedQ")}</p>
  <div class="options">
    <OptionGrid
      options={question.options.map((_, i) => i)}
      correct={(i) => question.options[i] === word.pronunciation}
      chosen={result ? chosen : null}
      onpick={pick}
    >
      {#snippet item(i)}<span class="opt">{question.options[i]}</span>{/snippet}
    </OptionGrid>
  </div>
{/if}

<style>
  .intro {
    padding: 32px 8px;
    text-align: center;
  }
  .part {
    margin: 0;
    color: var(--accent);
    font-weight: 600;
  }
  h2 {
    margin: 8px 0;
    font-size: 24px;
  }
  .start {
    width: 100%;
    min-height: var(--tap);
    margin-top: 24px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font: inherit;
    font-size: 17px;
    font-weight: 600;
  }
  .head {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }
  .clock.slow {
    color: var(--warn);
  }
  .word {
    margin: 40px 0 8px;
    font-size: calc(48px * var(--glyph-scale));
    text-align: center;
  }
  .q {
    margin: 0 0 20px;
    color: var(--muted);
    font-size: 15px;
    text-align: center;
  }
  .options :global(.grid) {
    grid-template-columns: 1fr;
  }
  .opt {
    font-size: 20px;
    font-weight: 500;
  }
</style>
