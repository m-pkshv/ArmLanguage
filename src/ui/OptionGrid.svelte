<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  // Сетка вариантов ответа 2×2 (или 2×3). После ответа подсвечивает правильный и выбранный.
  // Клавиши 1–6 на компьютере выбирают вариант (docs/05-ui-mobile.md, 5.6).
  let {
    options,
    correct,
    chosen = null,
    onpick,
    item,
    big = false,
  }: {
    options: T[];
    /** Какие варианты правильные — показываются после ответа. */
    correct: (o: T) => boolean;
    chosen?: T | null;
    onpick: (o: T) => void;
    item: Snippet<[T]>;
    /** Крупный шрифт — для армянских букв. */
    big?: boolean;
  } = $props();

  const answered = $derived(chosen !== null);

  function onkeydown(e: KeyboardEvent) {
    if (answered || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) {
      e.preventDefault();
      onpick(options[n - 1]!);
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="grid" class:three={options.length > 4}>
  {#each options as o, i (i)}
    {@const isChosen = answered && o === chosen}
    {@const isRight = answered && correct(o)}
    <button
      class="opt"
      class:big
      class:right={isRight}
      class:wrong={isChosen && !isRight}
      class:dim={answered && !isRight && !isChosen}
      disabled={answered}
      onclick={() => onpick(o)}
    >
      {@render item(o)}
      {#if isRight}<span class="mark" aria-label="верно">✓</span>{:else if isChosen}<span class="mark" aria-label="неверно">✗</span>{/if}
    </button>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    /* колонки поровну, даже если вариант длинный */
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
  }
  .opt {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 64px;
    padding: 8px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 22px;
    font-weight: 500;
    transition:
      border-color 0.15s,
      background 0.15s,
      opacity 0.15s;
  }
  .opt.big {
    min-height: 84px;
    font-size: calc(36px * var(--glyph-scale));
  }
  @media (hover: hover) {
    .opt:not(:disabled):hover {
      border-color: var(--accent);
    }
  }
  .opt:disabled {
    cursor: default;
  }
  .right {
    border-color: var(--good);
    background: var(--good-soft);
  }
  .wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .dim {
    opacity: 0.45;
  }
  .mark {
    position: absolute;
    top: 4px;
    right: 8px;
    font-size: 16px;
  }
  .right .mark {
    color: var(--good);
  }
  .wrong .mark {
    color: var(--bad);
  }
</style>
