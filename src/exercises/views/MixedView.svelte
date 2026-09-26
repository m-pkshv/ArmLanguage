<script lang="ts">
  import { content } from "../../core/content";
  import { t } from "../../i18n";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import RuKeyboard from "../../ui/RuKeyboard.svelte";
  import { byId } from "../helpers";
  import type { MixedAnswer, MixedQuestion } from "../mixedReading";
  import type { CheckResult } from "../types";

  // E09: смешанное чтение. Нажатие на армянскую букву показывает её чтение (подсказка → «почти»).
  let { question, result, onanswer }: { question: MixedQuestion; result: CheckResult | null; onanswer: (a: MixedAnswer) => void } = $props();

  let revealed = $state<number[]>([]);
  let chosen = $state<number | null>(null);
  let value = $state("");
  const hinted = $derived(revealed.length > 0);

  // Слова целиком — чтобы строка не переносилась посреди слова между армянскими буквами-кнопками.
  type Part = { text: string; seg: number; letter?: string };
  const words = $derived.by(() => {
    const out: Part[][] = [[]];
    question.segments.forEach((seg, i) => {
      if (seg.letter) {
        out[out.length - 1]!.push({ text: seg.text, seg: i, letter: seg.letter });
        return;
      }
      seg.text.split(/(\s+)/).forEach((piece, k) => {
        if (!piece) return;
        if (k % 2 === 1) out.push([]); // пробел — начало нового слова
        else out[out.length - 1]!.push({ text: piece, seg: i });
      });
    });
    return out.filter((w) => w.length);
  });

  function reveal(i: number) {
    if (!result && !revealed.includes(i)) revealed = [...revealed, i];
  }
</script>

<div class="prompt">
  <p class="q">{t("session.qMixed")}</p>
  <p class="text" class:long={question.source === "text"}>
    {#each words as word, w (w)}<span class="w">{#each word as part, k (k)}{#if part.letter}<button
            class="arm hy"
            lang="hy"
            class:open={revealed.includes(part.seg) || !!result}
            onclick={() => reveal(part.seg)}
            disabled={!!result}>{part.text}<span class="tip">{byId(content, part.letter).sound.canonical}</span></button
          >{:else}{part.text}{/if}{/each}</span>{" "}{/each}
  </p>
  <p class="hint">{hinted ? t("session.mixedHintUsed") : t("session.mixedHint")}</p>
</div>

{#if question.mode === "choice" && question.options}
  <div class="options">
    <OptionGrid
      options={question.options.map((_, i) => i)}
      correct={(i) => question.options![i] === question.answer}
      chosen={result ? chosen : null}
      onpick={(i) => {
        chosen = i;
        onanswer({ value: question.options![i]!, hinted });
      }}
    >
      {#snippet item(i)}<span class="opt">{question.options![i]}</span>{/snippet}
    </OptionGrid>
  </div>
{:else}
  <RuKeyboard keys={null} bind:value maxLength={14} disabled={!!result} onsubmit={() => onanswer({ value, hinted })} ongiveup={() => onanswer({ value: "", hinted })} />
{/if}

<style>
  .prompt {
    margin-bottom: 16px;
    text-align: center;
  }
  .q {
    margin: 8px 0 12px;
    color: var(--muted);
    font-size: 15px;
  }
  .text {
    margin: 28px 0 0; /* место для подсказок над буквами */
    font-size: calc(34px * var(--glyph-scale));
    line-height: 1.6;
  }
  .w {
    white-space: nowrap;
  }
  .text.long {
    font-size: calc(24px * var(--glyph-scale));
    text-align: left;
  }
  .arm {
    position: relative;
    padding: 0 1px;
    border: 0;
    border-bottom: 2px dotted var(--accent);
    background: none;
    color: var(--accent);
    font: inherit;
    line-height: 1.2;
    cursor: help;
  }
  .arm:disabled {
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
  .hint {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 13px;
  }
  .options :global(.grid) {
    grid-template-columns: 1fr;
  }
  .opt {
    font-size: 19px;
    font-weight: 500;
    text-align: center;
  }
</style>
