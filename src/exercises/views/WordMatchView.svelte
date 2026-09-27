<script lang="ts">
  import { onDestroy } from "svelte";
  import { assetUrl, content } from "../../core/content";
  import { studyItem } from "../../core/words";
  import { t } from "../../i18n";
  import type { CheckResult } from "../types";
  import type { WordMatchAnswer, WordMatchQuestion } from "../words/logic";

  // W04: найди пары — армянские слова ↔ картинки с переводом. Нажать карточку в одной колонке и её пару в другой.
  let { question, result, onanswer }: { question: WordMatchQuestion; result: CheckResult | null; onanswer: (a: WordMatchAnswer) => void } = $props();

  const started = Date.now();
  let now = $state(Date.now());
  let pickLeft = $state<string | null>(null);
  let pickRight = $state<string | null>(null);
  let matched = $state<string[]>([]);
  let wrong = $state<[string, string] | null>(null);
  let mistakes = $state<[string, string][]>([]);
  let finished = $state(false);
  const tick = setInterval(() => (now = Date.now()), 500);
  onDestroy(() => clearInterval(tick));

  const secs = $derived(Math.round((now - started) / 1000));
  const busy = $derived(!!wrong || finished || !!result);

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
        finished = true;
        clearInterval(tick);
        onanswer({ ms: Date.now() - started, mistakes });
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
</script>

<div class="head">
  <p class="q">{t("session.qWordMatch")}</p>
  <p class="stats">
    <span>⏱ {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
    <span class:bad={mistakes.length > 0}>{t("session.matchErrors", { n: mistakes.length })}</span>
  </p>
</div>

<div class="board">
  <div class="col">
    {#each question.left as id (id)}
      <button
        class="card hy"
        class:long={studyItem(content, id).hy.length > 9}
        lang="hy"
        class:picked={pickLeft === id}
        class:ok={matched.includes(id)}
        class:wrong={wrong?.[0] === id}
        disabled={matched.includes(id)}
        onclick={() => pick("left", id)}>{studyItem(content, id).hy}</button
      >
    {/each}
  </div>
  <div class="col">
    {#each question.right as id (id)}
      {@const x = studyItem(content, id)}
      <button class="card ru" class:picked={pickRight === id} class:ok={matched.includes(id)} class:wrong={wrong?.[1] === id} disabled={matched.includes(id)} onclick={() => pick("right", id)}>
        {#if x.image}<img class="word-pic" src={assetUrl(x.image.file)} alt="" width="36" height="36" />{/if}
        <span>{x.ru}</span>
      </button>
    {/each}
  </div>
</div>

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
    /* колонки поровну, даже если слово длинное (շնորհակալություն) */
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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
    gap: 6px;
    min-height: 64px;
    padding: 4px 8px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    font: inherit;
    transition:
      opacity 0.25s,
      background 0.15s,
      border-color 0.15s;
  }
  .card.hy {
    font-family: var(--font-hy);
    font-size: calc(22px * var(--glyph-scale));
  }
  .card.hy.long {
    font-size: calc(15px * var(--glyph-scale));
    overflow-wrap: anywhere;
  }
  .card.ru {
    font-size: 15px;
    line-height: 1.2;
    text-align: left;
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
    opacity: 0.35;
  }
</style>
