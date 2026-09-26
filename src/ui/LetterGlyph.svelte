<script lang="ts">
  import type { Letter } from "../core/content/types";
  import Handwriting from "./Handwriting.svelte";

  // Буква печатным или рукописным шрифтом: заглавная + строчная.
  // size — высота строчной буквы в пикселях (рукописная форма — по высоте разлиновки).
  let { letter, script, size = 30 }: { letter: Letter; script: "print" | "handwriting"; size?: number } = $props();

  const hw = $derived(script === "handwriting" ? letter.handwriting : null);
</script>

{#if hw}
  <span class="pair" aria-label="{letter.upper} {letter.lower}">
    {#if hw.upper}<Handwriting file={hw.upper} label={letter.upper} height={size * 2.2} />{/if}
    <Handwriting file={hw.lower} label={letter.lower} height={size * 2.2} />
  </span>
{:else}
  <span class="print hy" lang="hy" style:font-size="{size}px">
    {#if letter.upper !== letter.lower}{letter.upper}{/if}<span class="lower">{letter.lower}</span>
  </span>
{/if}

<style>
  .pair {
    display: inline-flex;
    align-items: center;
  }
  .print {
    line-height: 1.15;
    white-space: nowrap;
  }
  .lower {
    margin-left: 0.12em;
  }
</style>
