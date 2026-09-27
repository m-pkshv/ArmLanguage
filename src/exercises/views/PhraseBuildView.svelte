<script lang="ts">
  import { content } from "../../core/content";
  import { studyItem } from "../../core/words";
  import { t } from "../../i18n";
  import type { CheckResult } from "../types";
  import type { PhraseBuildQuestion } from "../words/logic";

  // W07: собери фразу — нажимать армянские слова по порядку; нажатие на выбранное слово возвращает его обратно.
  let { question, result, onanswer }: { question: PhraseBuildQuestion; result: CheckResult | null; onanswer: (a: string[]) => void } = $props();

  // выбранные карточки — по номеру в банке (одинаковые слова различаются)
  let picked = $state<number[]>([]);
  const item = $derived(studyItem(content, question.item));
  const words = $derived(picked.map((i) => question.bank[i]!));

  function take(i: number) {
    if (!result && !picked.includes(i)) picked = [...picked, i];
  }
  function drop(k: number) {
    if (!result) picked = picked.filter((_, j) => j !== k);
  }
</script>

<div class="prompt">
  <div class="ru">{item.ru}</div>
  <p class="q">{t("session.qPhraseBuild")}</p>
</div>

<div class="answer hy" class:ok={result?.verdict === "correct"} class:bad={result && result.verdict !== "correct"} lang="hy">
  {#each words as w, k (k)}<button class="chip" onclick={() => drop(k)} disabled={!!result}>{w}</button>{/each}
</div>
{#if result && result.verdict !== "correct"}
  <p class="right hy" lang="hy">{item.hy}</p>
{/if}
{#if question.reading || result}<p class="pron">[{item.pronunciation}]</p>{/if}

<div class="bank hy" lang="hy">
  {#each question.bank as w, i (i)}
    <button class="chip" class:used={picked.includes(i)} onclick={() => take(i)} disabled={!!result || picked.includes(i)}>{w}</button>
  {/each}
</div>

<div class="actions">
  <button class="btn" onclick={() => onanswer([])} disabled={!!result}>{t("session.dontKnow")}</button>
  <button class="btn primary" onclick={() => onanswer(words)} disabled={!!result || !words.length}>{t("session.check")}</button>
</div>

<style>
  .prompt {
    margin-bottom: 12px;
    text-align: center;
  }
  .ru {
    margin-top: 16px;
    font-size: 24px;
    font-weight: 600;
  }
  .q {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
  .answer {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 8px;
    min-height: 64px;
    padding: 10px;
    border-bottom: 2px solid var(--accent);
  }
  .answer.ok {
    border-color: var(--good);
  }
  .answer.bad {
    border-color: var(--bad);
  }
  .right {
    margin: 8px 0 0;
    color: var(--good);
    font-size: 20px;
    text-align: center;
  }
  .pron {
    margin: 4px 0 0;
    color: var(--muted);
    text-align: center;
  }
  .bank {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin: 20px 0;
  }
  .chip {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    font-family: var(--font-hy);
    font-size: calc(20px * var(--glyph-scale));
  }
  .chip.used {
    visibility: hidden;
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 10px;
  }
  .btn {
    min-height: var(--tap);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-weight: 600;
  }
  .btn.primary {
    border: 0;
    background: var(--accent);
    color: var(--accent-text);
  }
  .btn:disabled {
    opacity: 0.5;
  }
</style>
