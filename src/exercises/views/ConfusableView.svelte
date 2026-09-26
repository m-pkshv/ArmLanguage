<script lang="ts">
  import { assetUrl, content, wordById } from "../../core/content";
  import { t } from "../../i18n";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import type { ConfusableAnswer, ConfusableQuestion } from "../confusable";
  import { byId, pairText } from "../helpers";
  import type { CheckResult } from "../types";

  // E10: пары-ловушки — выбрать верное написание или отметить все нужные буквы в сетке.
  let {
    question,
    result,
    onanswer,
  }: { question: ConfusableQuestion; result: CheckResult | null; onanswer: (a: ConfusableAnswer) => void } = $props();

  let chosen = $state<number | null>(null);
  let picked = $state<number[]>([]);

  const word = $derived(question.mode === "spelling" ? wordById(question.word)! : null);
  const letter = $derived(byId(content, question.letter));

  function toggle(i: number) {
    if (result) return;
    picked = picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i];
  }

  function onkeydown(e: KeyboardEvent) {
    if (question.mode === "grid" && !result && e.key === "Enter" && picked.length) {
      e.preventDefault();
      onanswer(picked);
    }
  }
</script>

<svelte:window {onkeydown} />

{#if question.mode === "spelling" && word}
  <div class="prompt">
    {#if word.image}<img src={assetUrl(word.image.file)} alt="" width="88" height="88" />{/if}
    <p class="reading">
      [{#each question.reading as part, i (i)}{#if i === question.blank}<mark>{part}</mark>{:else}{part}{/if}{/each}] — {word.ru}
    </p>
    <p class="q">{t("session.qSpelling")}</p>
  </div>
  <OptionGrid
    options={[0, 1]}
    correct={(i) => i === question.correct}
    chosen={result ? chosen : null}
    big
    onpick={(i) => {
      chosen = i;
      onanswer(i);
    }}
  >
    {#snippet item(i)}<span class="hy word" lang="hy">{question.options[i]}</span>{/snippet}
  </OptionGrid>
{:else if question.mode === "grid"}
  <div class="prompt">
    <div class="target hy" lang="hy">{letter.lower}</div>
    <p class="q">{t("session.qGrid", { letter: pairText(letter) })}</p>
  </div>
  <div class="grid">
    {#each question.cells as id, i (i)}
      {@const on = picked.includes(i)}
      {@const isTarget = id === question.letter}
      <button
        class="cell hy"
        lang="hy"
        class:on
        class:right={!!result && isTarget}
        class:wrong={!!result && on && !isTarget}
        aria-pressed={on}
        disabled={!!result}
        onclick={() => toggle(i)}
      >
        {byId(content, id).lower}
      </button>
    {/each}
  </div>
  <button class="done" disabled={!!result || !picked.length} onclick={() => onanswer(picked)}>{t("session.gridDone")}</button>
{/if}

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
    text-align: center;
  }
  .reading {
    margin: 8px 0 0;
    font-size: 20px;
  }
  mark {
    padding: 0 2px;
    border-radius: 4px;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 700;
  }
  .q {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
  .word {
    font-size: calc(30px * var(--glyph-scale));
  }
  .target {
    color: var(--accent);
    font-size: calc(72px * var(--glyph-scale));
    line-height: 1.2;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .cell {
    aspect-ratio: 1;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: calc(34px * var(--glyph-scale));
  }
  .cell.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .cell.right {
    border-color: var(--good);
    background: var(--good-soft);
  }
  .cell.wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .cell:disabled {
    cursor: default;
  }
  .done {
    width: 100%;
    min-height: 54px;
    margin-top: 16px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font-size: 17px;
    font-weight: 600;
  }
  .done:disabled {
    opacity: 0.5;
  }
</style>
