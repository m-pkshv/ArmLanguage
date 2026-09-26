<script lang="ts">
  import { assetUrl, content } from "../../core/content";
  import { t } from "../../i18n";
  import Glyph from "../../ui/Glyph.svelte";
  import HyKeyboard from "../../ui/HyKeyboard.svelte";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import { byId } from "../helpers";
  import type { RuInsertQuestion } from "../ruWordInsert";
  import type { CheckResult } from "../types";

  // E08: русское слово с пропуском → вставить армянскую букву с этим звуком.
  let { question, result, onanswer }: { question: RuInsertQuestion; result: CheckResult | null; onanswer: (a: string) => void } = $props();

  let chosen = $state<string | null>(null);
  const word = $derived(content.ruWords.find((w) => w.id === question.ruWord)!);
  const before = $derived(word.ru.slice(0, question.pos));
  const sound = $derived(word.ru.slice(question.pos, question.pos + question.len));
  const after = $derived(word.ru.slice(question.pos + question.len));
  const shown = $derived(result && chosen ? byId(content, question.accepted.includes(chosen) ? chosen : question.letter) : null);

  function pick(id: string) {
    chosen = id;
    onanswer(id);
  }
</script>

<div class="prompt">
  {#if word.image}<img src={assetUrl(word.image.file)} alt="" width="88" height="88" />{/if}
  <div class="word">
    {before}<span class="blank" class:filled={!!shown}>{#if shown}<span class="hy" lang="hy">{shown.lower}</span>{:else}?{/if}</span>{after}
  </div>
  <p class="q">{t("session.qRuInsert", { sound })}</p>
</div>

{#if question.options}
  <OptionGrid options={question.options} correct={(id) => question.accepted.includes(id)} chosen={result ? chosen : null} big onpick={pick}>
    {#snippet item(id)}<Glyph letter={byId(content, id)} form="lower" size={36} />{/snippet}
  </OptionGrid>
{:else if question.keys}
  <HyKeyboard
    letters={question.keys.map((id) => byId(content, id))}
    onpick={pick}
    disabled={!!result}
    chosen={result ? chosen : null}
    correct={(id) => question.accepted.includes(id)}
  />
{/if}

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
    font-size: 38px;
    font-weight: 500;
    line-height: 1.3;
  }
  .blank {
    display: inline-block;
    min-width: 0.8em;
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
  .q {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
</style>
