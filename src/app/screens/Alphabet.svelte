<script lang="ts">
  import { LETTERS } from "../../core/content/alphabet";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { hrefOf } from "../routes";
</script>

<ScreenHeader title={t("alphabet.title")} />
<p class="muted hint">{t("alphabet.hint")}</p>

<div class="grid">
  {#each LETTERS as letter (letter.id)}
    <a class="cell" href={hrefOf({ name: "letter", id: letter.id })}>
      <span class="hy glyph" lang="hy">{letter.upper}<small>{letter.lower}</small></span>
    </a>
  {/each}
</div>

<style>
  .hint {
    margin: 0 0 16px;
    font-size: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 8px;
  }
  .cell {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    text-decoration: none;
  }
  .glyph {
    font-size: calc(26px * var(--glyph-scale));
    line-height: 1;
  }
  small {
    margin-left: 3px;
    color: var(--muted);
    font-size: 0.75em;
  }
</style>
