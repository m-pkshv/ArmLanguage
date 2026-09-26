<script lang="ts">
  import { assetUrl, content, wordById } from "../../core/content";
  import { indexLetters, readingOf, tokensOf } from "../../core/text/armenian";
  import { t } from "../../i18n";
  import RuKeyboard from "../../ui/RuKeyboard.svelte";
  import type { CheckResult } from "../types";
  import type { WordReadingAnswer, WordReadingDetail, WordReadingQuestion } from "../wordReading";

  // E07: прочитай слово. Нажатие на букву показывает её чтение (эта буква — «почти»).
  // После ответа слово разбирается по буквам: ошибка видна на конкретной букве.
  let { question, result, onanswer }: { question: WordReadingQuestion; result: CheckResult | null; onanswer: (a: WordReadingAnswer) => void } = $props();

  let value = $state("");
  let revealed = $state<number[]>([]);
  const word = $derived(wordById(question.word)!);
  const tokens = $derived(tokensOf(word.hy));
  const reading = $derived(readingOf(tokens, indexLetters(content.letters)));
  const detail = $derived(result?.detail as WordReadingDetail | undefined);

  function reveal(i: number) {
    if (!result && !revealed.includes(i)) revealed = [...revealed, i];
  }
  const submit = (v: string) => onanswer({ value: v, hinted: revealed });
</script>

<div class="prompt">
  {#if question.hint || result}
    <div class="pic">
      {#if word.image}<img src={assetUrl(word.image.file)} alt="" width="72" height="72" />{/if}
      <span class="ru">{word.ru}</span>
    </div>
  {/if}
  <div class="word hy" class:long={tokens.length > 6} lang="hy">
    {#each tokens as tok, i (i)}
      {@const r = detail?.letters[i]}
      {@const status = r ? (detail!.hinted.includes(i) && r.status === "ok" ? "partial" : r.status) : null}
      <div class="col">
        <button class="arm" class:open={revealed.includes(i) && !result} onclick={() => reveal(i)} disabled={!!result}>
          {tok}<span class="tip">{reading[i]}</span>
        </button>
        {#if r && status}
          <span class="read {status}">{r.expected}</span>
          {#if r.status !== "ok" && detail!.letters.some((x) => x.given)}<s class="given">{r.given || "—"}</s>{/if}
        {/if}
      </div>
    {/each}
  </div>
  <p class="q">{t("session.qWordReading")}</p>
  <p class="hint">{#if !result}{revealed.length ? t("session.wordHintUsed") : t("session.wordHint")}{/if}</p>
</div>

<RuKeyboard keys={null} bind:value maxLength={16} disabled={!!result} onsubmit={() => submit(value)} ongiveup={() => submit("")} />

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 12px;
    text-align: center;
  }
  .pic {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .ru {
    color: var(--muted);
    font-size: 15px;
  }
  .word {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 30px; /* место для подсказок над буквами */
    font-size: calc(40px * var(--glyph-scale));
    line-height: 1.2;
  }
  .word.long {
    font-size: calc(30px * var(--glyph-scale));
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0.6em;
  }
  .arm {
    position: relative;
    padding: 0 1px;
    border: 0;
    border-bottom: 2px dotted var(--line);
    background: none;
    color: var(--text);
    font: inherit;
    line-height: inherit;
    cursor: help;
  }
  .arm:disabled {
    border-bottom-color: transparent;
    cursor: default;
  }
  .tip {
    position: absolute;
    left: 50%;
    bottom: 100%;
    display: none;
    padding: 0 6px;
    border-radius: 6px;
    background: var(--text);
    color: var(--bg);
    font-family: var(--font-ui);
    font-size: 14px;
    line-height: 1.6;
    white-space: nowrap;
    transform: translateX(-50%);
  }
  .arm.open .tip {
    display: block;
  }
  .read {
    margin-top: 2px;
    padding: 0 4px;
    border-radius: 6px;
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }
  .read.ok {
    color: var(--good);
  }
  .read.partial {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .read.wrong {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .given {
    color: var(--muted);
    font-family: var(--font-ui);
    font-size: 13px;
    line-height: 1.4;
  }
  .q {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
  .hint {
    min-height: 2.8em; /* две строки: клавиатура не прыгает, когда текст подсказки меняется */
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 13px;
  }
</style>
