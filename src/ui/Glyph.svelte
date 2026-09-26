<script lang="ts">
  import type { Letter } from "../core/content/types";
  import Handwriting from "./Handwriting.svelte";

  // Буква в задании: заглавная, строчная или обе; печатная или рукописная.
  // size — размер печатной буквы в пикселях; рукописная подбирается по высоте разлиновки.
  let {
    letter,
    form = "pair",
    handwriting = false,
    size = 96,
  }: { letter: Letter; form?: "upper" | "lower" | "pair"; handwriting?: boolean; size?: number } = $props();

  const showUpper = $derived(form !== "lower" && letter.upper !== letter.lower && letter.id !== "yev");
  const showLower = $derived(form !== "upper" || letter.upper === letter.lower);
  const hw = $derived(handwriting ? letter.handwriting : null);
</script>

{#if hw}
  <span class="hw" aria-label={[showUpper && letter.upper, showLower && letter.lower].filter(Boolean).join(" ")}>
    {#if showUpper && hw.upper}<Handwriting file={hw.upper} label={letter.upper} height={size * 1.6} />{/if}
    {#if showLower}<Handwriting file={hw.lower} label={letter.lower} height={size * 1.6} />{/if}
  </span>
{:else}
  <span class="print hy" lang="hy" style:font-size="calc({size}px * var(--glyph-scale))">
    {#if showUpper}{letter.upper}{/if}{#if showUpper && showLower}&nbsp;{/if}{#if showLower}{letter.lower}{/if}
  </span>
{/if}

<style>
  .hw {
    display: inline-flex;
    align-items: center;
    color: var(--text);
  }
  .print {
    line-height: 1.15;
    white-space: nowrap;
  }
</style>
