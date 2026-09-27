<script lang="ts">
  import { assetUrl, content } from "../../core/content";
  import type { WordExerciseId } from "../../core/session/types";
  import { studyItem } from "../../core/words";
  import { t } from "../../i18n";
  import HyKeyboard from "../../ui/HyKeyboard.svelte";
  import type { CheckResult } from "../types";
  import type { WordSpellQuestion } from "../words/logic";

  // W05 «собери слово» — нажимать карточки с буквами по порядку; W06 «напиши слово» — армянская клавиатура
  // со всеми буквами. Нажатие на набранную букву убирает её.
  let {
    type,
    question,
    result,
    onanswer,
  }: { type: WordExerciseId; question: WordSpellQuestion; result: CheckResult | null; onanswer: (a: string[]) => void } = $props();

  const item = $derived(studyItem(content, question.item));
  const tiles = $derived(type === "word-build");
  // «собери слово»: номера выбранных карточек; «напиши слово»: набранные буквы
  let picked = $state<number[]>([]);
  let typed = $state<string[]>([]);
  const answer = $derived(tiles ? picked.map((i) => question.tiles[i]!) : typed);
  const keyboard = [...content.letters].sort((a, b) => a.order - b.order);

  function drop(k: number) {
    if (result) return;
    if (tiles) picked = picked.filter((_, j) => j !== k);
    else typed = typed.filter((_, j) => j !== k);
  }
  // посимвольная подсветка после ответа: верная буква на своём месте — зелёная
  const status = (k: number) => (result ? (answer[k] === question.letters[k] ? "ok" : "bad") : "");
</script>

<div class="prompt">
  {#if item.image}<img class="word-pic" src={assetUrl(item.image.file)} alt="" width="88" height="88" />{/if}
  <div class="ru">{item.ru}</div>
  {#if question.reading || result}<div class="pron">[{item.pronunciation}]</div>{/if}
  <p class="q">{tiles ? t("session.qWordBuild") : t("session.qWordWrite")}</p>
</div>

<div class="answer hy" lang="hy">
  {#each answer as l, k (k)}<button class="cell {status(k)}" onclick={() => drop(k)} disabled={!!result}>{l}</button>{/each}
  {#if !answer.length}<span class="placeholder">…</span>{/if}
</div>
{#if result && result.verdict !== "correct"}<p class="right hy" lang="hy">{question.letters.join("")}</p>{/if}

{#if tiles}
  <div class="tiles hy" lang="hy">
    {#each question.tiles as l, i (i)}
      <button class="tile" class:used={picked.includes(i)} onclick={() => !result && (picked = [...picked, i])} disabled={!!result || picked.includes(i)}>{l}</button>
    {/each}
  </div>
{:else}
  <div class="kb">
    <HyKeyboard letters={keyboard} disabled={!!result} onpick={(id) => (typed = [...typed, keyboard.find((l) => l.id === id)!.lower])} />
  </div>
{/if}

<div class="actions">
  <button class="btn" onclick={() => onanswer([])} disabled={!!result}>{t("session.dontKnow")}</button>
  <button class="btn primary" onclick={() => onanswer(answer)} disabled={!!result || !answer.length}>{t("session.check")}</button>
</div>

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .ru {
    margin-top: 6px;
    font-size: 22px;
    font-weight: 600;
  }
  .pron {
    color: var(--muted);
  }
  .q {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
  .answer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    min-height: 56px;
    margin-top: 10px;
    padding: 6px;
    border-bottom: 2px solid var(--accent);
  }
  .placeholder {
    align-self: center;
    color: var(--muted);
  }
  .cell {
    min-width: 36px;
    padding: 0 4px;
    border: 0;
    border-radius: 8px;
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--font-hy);
    font-size: calc(28px * var(--glyph-scale));
  }
  .cell.ok {
    background: var(--good-soft);
    color: var(--good);
  }
  .cell.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .right {
    margin: 6px 0 0;
    color: var(--good);
    font-size: 24px;
    text-align: center;
  }
  .tiles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin: 18px 0;
  }
  .tile {
    min-width: 52px;
    height: 52px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    font-family: var(--font-hy);
    font-size: calc(26px * var(--glyph-scale));
  }
  .tile.used {
    visibility: hidden;
  }
  .kb {
    margin: 12px 0;
  }
  .kb :global(.key) {
    height: 44px;
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
