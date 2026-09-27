<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { app } from "../../app/state.svelte";
  import { content } from "../../core/content";
  import { t } from "../../i18n";
  import Handwriting from "../../ui/Handwriting.svelte";
  import { byId, pairText } from "../helpers";
  import { formatTime, rightLabel, type MatchAnswer, type MatchQuestion } from "../matchPairs";
  import type { CheckResult } from "../types";

  // E05: «Найди пары». Нажать карточку в одной колонке и её пару в другой (в любом порядке).
  let { question, result, onanswer }: { question: MatchQuestion; result: CheckResult | null; onanswer: (a: MatchAnswer) => void } = $props();

  // Рекорд до этого раунда — чтобы после ответа сказать «Новый рекорд!» (вид создаётся заново на каждое поле)
  const prevBest = untrack(() => app.progress.games[question.kind]?.bestMs ?? null);
  const started = Date.now();
  let now = $state(Date.now());
  let finishedMs = $state<number | null>(null);
  let pickLeft = $state<string | null>(null);
  let pickRight = $state<string | null>(null);
  let matched = $state<string[]>([]);
  let wrong = $state<[string, string] | null>(null);
  let mistakes = $state<[string, string][]>([]);

  const tick = setInterval(() => (now = Date.now()), 250);
  onDestroy(() => clearInterval(tick));

  const elapsed = $derived(finishedMs ?? now - started);
  const busy = $derived(!!wrong || finishedMs !== null || !!result);

  function pick(side: "left" | "right", id: string) {
    if (busy || matched.includes(id)) return;
    if (side === "left") pickLeft = pickLeft === id ? null : id;
    else pickRight = pickRight === id ? null : id;
    if (!pickLeft || !pickRight) return;
    const [l, r] = [pickLeft, pickRight];
    if (l === r) {
      matched = [...matched, l];
      pickLeft = pickRight = null;
      if (matched.length === question.left.length) {
        finishedMs = Date.now() - started;
        clearInterval(tick);
        onanswer({ ms: finishedMs, mistakes });
      }
    } else {
      mistakes = [...mistakes, [l, r]];
      wrong = [l, r];
      setTimeout(() => {
        wrong = null;
        pickLeft = pickRight = null;
      }, 650);
    }
  }

  const newRecord = $derived(finishedMs !== null && !mistakes.length && (prevBest === null || finishedMs < prevBest));
</script>

<div class="head">
  <p class="q">{t("session.qMatch")}</p>
  <p class="stats">
    <span>⏱ {formatTime(elapsed)}</span>
    <span class:bad={mistakes.length > 0}>{t("session.matchErrors", { n: mistakes.length })}</span>
  </p>
</div>

{#if finishedMs !== null}
  <div class="done">
    <div class="time">{formatTime(finishedMs)}</div>
    {#if newRecord}
      <p class="record">{t("session.matchNewRecord")}</p>
    {:else if prevBest !== null}
      <p class="muted">{t("session.matchBest", { time: formatTime(prevBest) })}</p>
    {/if}
    {#if mistakes.length}<p class="muted">{t("session.matchNoRecord")}</p>{/if}
  </div>
{:else}
  <div class="board">
    <div class="col">
      {#each question.left as id (id)}
        {@const l = byId(content, id)}
        <button
          class="card hy"
          lang="hy"
          class:picked={pickLeft === id}
          class:ok={matched.includes(id)}
          class:wrong={wrong?.[0] === id}
          disabled={matched.includes(id)}
          onclick={() => pick("left", id)}
        >
          {question.kind === "sound" ? pairText(l) : question.kind === "case" ? l.upper : l.lower}
        </button>
      {/each}
    </div>
    <div class="col">
      {#each question.right as id (id)}
        {@const l = byId(content, id)}
        <button
          class="card"
          class:hy={question.kind !== "sound"}
          class:picked={pickRight === id}
          class:ok={matched.includes(id)}
          class:wrong={wrong?.[1] === id}
          disabled={matched.includes(id)}
          onclick={() => pick("right", id)}
        >
          {#if question.kind === "handwriting" && l.handwriting}
            <Handwriting file={l.handwriting.lower} label={t("session.matchHandwritten")} height={52} />
          {:else}
            {rightLabel(l, question.kind)}
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .head {
    text-align: center;
  }
  .q {
    margin: 8px 0 4px;
    color: var(--muted);
    font-size: 15px;
  }
  .stats {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin: 0 0 12px;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }
  .bad {
    color: var(--bad);
  }
  .board {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 64px;
    padding: 4px 8px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    font: inherit;
    font-size: 22px;
    font-weight: 500;
    transition:
      opacity 0.25s,
      background 0.15s,
      border-color 0.15s;
  }
  .card.hy {
    font-family: var(--font-hy);
    font-size: calc(28px * var(--glyph-scale));
  }
  .card.picked {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .card.wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .card.ok {
    border-color: var(--good);
    background: var(--good-soft);
    box-shadow: none;
    opacity: 0.35;
  }
  .done {
    padding: 24px 0;
    text-align: center;
  }
  .time {
    font-size: 48px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .record {
    color: var(--good);
    font-size: 18px;
    font-weight: 600;
  }
  .muted {
    margin: 6px 0 0;
  }
</style>
