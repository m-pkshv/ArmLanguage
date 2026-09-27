<script lang="ts">
  import { assetUrl, content } from "../../core/content";
  import { studyItem } from "../../core/words";
  import { t } from "../../i18n";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import type { CheckResult } from "../types";
  import type { WordChoiceQuestion } from "../words/logic";

  // W02 слово → смысл, W03 смысл → слово, W08 фраза → смысл. Чтение русскими буквами — пока слово новое;
  // потом его можно открыть нажатием (docs/10-first-words.md, 10.2).
  let { question, result, onanswer }: { question: WordChoiceQuestion; result: CheckResult | null; onanswer: (a: string) => void } = $props();

  let chosen = $state<string | null>(null);
  let revealed = $state(false);
  const item = $derived(studyItem(content, question.item));
  const phrase = $derived(item.kind === "phrase");
  const showPron = $derived(question.reading || revealed || !!result);
  const situation = $derived(content.phrases.find((p) => `phrase:${p.id}` === question.item)?.situation ?? "");
</script>

<div class="prompt">
  {#if question.mode === "meaning"}
    <div class="hy" class:phrase lang="hy">{item.hy}</div>
    {#if showPron}
      <div class="pron">[{item.pronunciation}]</div>
    {:else}
      <button class="reveal" onclick={() => (revealed = true)}>{t("session.showReading")}</button>
    {/if}
    <p class="q">{phrase ? t("session.qPhraseMeaning") : t("session.qWordMeaning")}</p>
  {:else if question.mode === "situation"}
    <!-- W09: ситуация — что вы скажете? -->
    <div class="situation">{situation}</div>
    <p class="q">{t("session.qSituation")}</p>
  {:else}
    {#if item.image}<img class="word-pic" src={assetUrl(item.image.file)} alt="" width="96" height="96" />{/if}
    <div class="ru">{item.ru}</div>
    <p class="q">{t("session.qWordProduce")}</p>
  {/if}
</div>

<div class="options" class:single={phrase} class:sit={question.mode === "situation"}>
  <OptionGrid
    options={question.options}
    correct={(id) => id === question.item}
    chosen={result ? chosen : null}
    big={question.mode === "produce"}
    onpick={(id) => {
      chosen = id;
      onanswer(id);
    }}
  >
    {#snippet item(id)}
      {@const o = studyItem(content, id)}
      {#if question.mode === "meaning"}
        <span class="opt-ru">
          {#if o.image && !phrase}<img class="word-pic" src={assetUrl(o.image.file)} alt="" width="44" height="44" />{/if}
          {o.ru}
        </span>
      {:else}
        <span class="opt-hy">
          <span lang="hy">{o.hy}</span>
          {#if question.reading || result}<small>[{o.pronunciation}]</small>{/if}
        </span>
      {/if}
    {/snippet}
  </OptionGrid>
</div>

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    margin-bottom: 16px;
    text-align: center;
  }
  .hy {
    font-family: var(--font-hy);
    font-size: calc(40px * var(--glyph-scale));
    line-height: 1.2;
  }
  .hy.phrase {
    font-size: calc(28px * var(--glyph-scale));
  }
  .pron {
    margin-top: 4px;
    color: var(--muted);
    font-size: 18px;
  }
  .reveal {
    margin-top: 6px;
    padding: 4px 12px;
    border: 1px dashed var(--line);
    border-radius: 999px;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 14px;
  }
  .situation {
    padding: 14px 16px;
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 18px;
    line-height: 1.4;
    text-align: left;
  }
  .sit .opt-hy {
    font-size: calc(20px * var(--glyph-scale));
  }
  .ru {
    margin-top: 8px;
    font-size: 26px;
    font-weight: 600;
  }
  .q {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
  .options.single :global(.grid) {
    grid-template-columns: 1fr;
  }
  .opt-ru {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 17px;
    font-weight: 500;
  }
  .opt-hy {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--font-hy);
  }
  .opt-hy small {
    color: var(--muted);
    font-family: var(--font-ui);
    font-size: 13px;
  }
</style>
