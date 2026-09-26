<script lang="ts">
  import type { Letter } from "../core/content/types";
  import { t } from "../i18n";

  // Армянская экранная клавиатура: только знакомые буквы, по алфавиту (docs/05-ui-mobile.md, 5.7).
  let {
    letters,
    onpick,
    upper = false,
    disabled = false,
    chosen = null,
    correct,
  }: {
    letters: Letter[];
    onpick: (id: string) => void;
    upper?: boolean;
    disabled?: boolean;
    chosen?: string | null;
    correct?: (id: string) => boolean;
  } = $props();
</script>

<div class="kb" role="group" aria-label={t("session.keyboard")}>
  {#each letters as l (l.id)}
    {@const answered = chosen !== null}
    <button
      class="key hy"
      lang="hy"
      class:right={answered && correct?.(l.id)}
      class:wrong={answered && chosen === l.id && !correct?.(l.id)}
      onclick={() => onpick(l.id)}
      {disabled}
    >
      {upper && l.upper !== l.lower ? l.upper : l.lower}
    </button>
  {/each}
</div>

<style>
  .kb {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
    gap: 6px;
    padding: 8px;
    border-radius: var(--radius-lg);
    background: var(--surface-2);
  }
  .key {
    height: 52px;
    border: 2px solid transparent;
    border-radius: 10px;
    background: var(--surface);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
    font-size: calc(24px * var(--glyph-scale));
  }
  .key:disabled {
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
</style>
