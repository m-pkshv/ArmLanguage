<script lang="ts">
  import type { Word } from "../core/content/types";
  import { t } from "../i18n";

  // Плитки со словами у урока алфавита (docs/09-navigation.md, «Слова урока»): армянское слово крупно,
  // нажатие открывает чтение русскими буквами и перевод, повторное — прячет.
  let { words }: { words: Word[] } = $props();

  let open = $state<Record<string, boolean>>({});
</script>

<div class="tiles">
  {#each words as w (w.id)}
    <button class="tile" class:open={open[w.id]} aria-expanded={!!open[w.id]} onclick={() => (open[w.id] = !open[w.id])}>
      <span class="hy" lang="hy">{w.hy}</span>
      {#if open[w.id]}
        <span class="info">[{w.pronunciation}] — {w.ru}</span>
      {/if}
    </button>
  {/each}
</div>
<p class="hint">{t("words.tapHint")}</p>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: 6px 4px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    overflow-wrap: anywhere;
  }
  .tile.open {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .hy {
    font-size: calc(20px * var(--glyph-scale));
    line-height: 1.3;
  }
  .info {
    color: var(--text);
    font-size: 13px;
    line-height: 1.3;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 13px;
  }
</style>
