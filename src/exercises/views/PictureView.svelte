<script lang="ts">
  import { assetUrl, content, wordById } from "../../core/content";
  import { t } from "../../i18n";
  import Glyph from "../../ui/Glyph.svelte";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import { byId } from "../helpers";
  import type { PictureQuestion } from "../picture";
  import type { CheckResult } from "../types";

  // E04: картинка + слово с пропуском → выбрать букву.
  let { question, result, onanswer }: { question: PictureQuestion; result: CheckResult | null; onanswer: (a: string) => void } = $props();

  let chosen = $state<string | null>(null);
  const word = $derived(wordById(question.word)!);
  const letter = $derived(byId(content, question.letter));
</script>

<div class="prompt">
  {#if word.image}<img class="word-pic" src={assetUrl(word.image.file)} alt="" width="96" height="96" />{/if}
  <div class="word hy" lang="hy">
    {#each question.tokens as tok, i (i)}
      {#if i === question.blank}
        <span class="blank" class:filled={!!result}>{result ? tok : "?"}</span>
      {:else}{tok}{/if}
    {/each}
  </div>
  <p class="reading">
    [{#each question.reading as part, i (i)}{#if i === question.blank}<mark>{part}</mark>{:else}{part}{/if}{/each}] — {word.ru}
  </p>
  <p class="q">{t("session.qPicture", { sound: question.reading[question.blank] ?? "" })}</p>
</div>

<OptionGrid
  options={question.options}
  correct={(id) => id === letter.id}
  chosen={result ? chosen : null}
  big
  onpick={(id) => {
    chosen = id;
    onanswer(id);
  }}
>
  {#snippet item(id)}
    <Glyph letter={byId(content, id)} form={question.upper ? "upper" : "lower"} size={36} />
  {/snippet}
</OptionGrid>

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
    text-align: center;
  }
  .word {
    margin-top: 8px;
    font-size: calc(40px * var(--glyph-scale));
    line-height: 1.3;
  }
  .blank {
    display: inline-block;
    min-width: 0.9em;
    margin: 0 2px;
    border-bottom: 3px solid var(--accent);
    color: var(--accent);
    text-align: center;
  }
  .blank.filled {
    border-color: transparent;
    border-radius: 6px;
    background: var(--accent-soft);
  }
  .reading {
    margin: 4px 0 0;
    font-size: 19px;
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
</style>
