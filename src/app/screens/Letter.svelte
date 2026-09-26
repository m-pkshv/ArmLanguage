<script lang="ts">
  import { LETTERS, letterById } from "../../core/content/alphabet";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { hrefOf } from "../routes";
  import NotFound from "./NotFound.svelte";

  let { id }: { id: string } = $props();

  const letter = $derived(letterById(id));
  const index = $derived(letter ? LETTERS.indexOf(letter) : -1);
  const prev = $derived(index > 0 ? LETTERS[index - 1] : undefined);
  const next = $derived(index >= 0 && index < LETTERS.length - 1 ? LETTERS[index + 1] : undefined);
</script>

{#if letter}
  <ScreenHeader title={t("alphabet.title")} backTo="#/alphabet" />
  <div class="card">
    <div class="glyph hy" lang="hy">{letter.upper} {letter.lower}</div>
    <p class="muted">{t("alphabet.letterSoon")}</p>
  </div>
  <!-- Соседние буквы в алфавитном порядке (см. docs/09-navigation.md, 9.10) -->
  <nav class="pager">
    {#if prev}<a href={hrefOf({ name: "letter", id: prev.id })} class="hy">‹ {prev.upper}</a>{:else}<span></span>{/if}
    {#if next}<a href={hrefOf({ name: "letter", id: next.id })} class="hy">{next.upper} ›</a>{/if}
  </nav>
{:else}
  <NotFound />
{/if}

<style>
  .card {
    padding: 32px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    text-align: center;
  }
  .glyph {
    font-size: calc(96px * var(--glyph-scale));
    line-height: 1.2;
  }
  .pager {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
  .pager a {
    display: grid;
    place-items: center;
    min-width: 72px;
    min-height: var(--tap);
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 22px;
    text-decoration: none;
  }
</style>
