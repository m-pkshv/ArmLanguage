<script lang="ts">
  import { assetUrl, LETTERS, letterById, wordById } from "../../core/content";
  import type { Word } from "../../core/content/types";
  import { highlightSegments } from "../../core/text/armenian";
  import { t } from "../../i18n";
  import Handwriting from "../../ui/Handwriting.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { hrefOf } from "../routes";
  import { app } from "../state.svelte";
  import NotFound from "./NotFound.svelte";

  // Карточка буквы (docs/02-features.md, 2.2). Статистика и звук появятся вместе с уроками.
  let { id }: { id: string } = $props();

  const letter = $derived(letterById(id));
  const index = $derived(letter ? LETTERS.indexOf(letter) : -1);
  const prev = $derived(index > 0 ? LETTERS[index - 1] : undefined);
  const next = $derived(index >= 0 && index < LETTERS.length - 1 ? LETTERS[index + 1] : undefined);
  const examples = $derived((letter?.words ?? []).map(wordById).filter((w): w is Word => !!w));
  const similar = $derived(
    letter ? [...new Set([...letter.confusable.sound, ...letter.confusable.shape])].map(letterById).filter((l) => !!l) : [],
  );
  const showIpa = $derived(app.progress.settings.showIpa);
</script>

{#if letter}
  <ScreenHeader title={t("alphabet.title")} backTo="#/alphabet" />

  <section class="card head">
    <div class="glyphs">
      <div class="print hy" lang="hy">
        {#if letter.upper !== letter.lower}{letter.upper}{/if}
        {letter.lower}
      </div>
      {#if letter.handwriting}
        <div class="hand" title={t("letter.handwritten")}>
          {#if letter.handwriting.upper}<Handwriting file={letter.handwriting.upper} label={letter.upper} height={96} />{/if}
          <Handwriting file={letter.handwriting.lower} label={letter.lower} height={96} />
        </div>
      {/if}
    </div>
    <div class="name">
      «{letter.name.ru}» · <span class="hy" lang="hy">{letter.name.hy}</span>
    </div>
    <div class="sound">
      <span class="tr">{letter.sound.canonical}</span>
      <span>{letter.sound.ru}</span>
      {#if showIpa}<span class="ipa">[{letter.sound.ipa}]</span>{/if}
    </div>
  </section>

  {#if letter.notes.length}
    <section class="notes">
      {#each letter.notes as note (note)}<p>{note}</p>{/each}
    </section>
  {/if}

  <h2>{t("letter.examples")}</h2>
  <ul class="words">
    {#each examples as word (word.id)}
      <li class="word">
        <div class="pic">
          {#if word.image}<img src={assetUrl(word.image.file)} alt="" loading="lazy" width="44" height="44" />{/if}
        </div>
        <div class="text">
          <div class="hy big" lang="hy">
            {#each highlightSegments(word.hy, letter.lower) as seg, i (i)}{#if seg.match}<mark>{seg.text}</mark>{:else}{seg.text}{/if}{/each}
          </div>
          <div class="muted">[{word.pronunciation}] — {word.ru}</div>
        </div>
      </li>
    {/each}
  </ul>

  {#if similar.length}
    <h2>{t("letter.similar")}</h2>
    <div class="similar">
      {#each similar as s (s.id)}
        <a href={hrefOf({ name: "letter", id: s.id })}>
          <span class="hy" lang="hy">{s.upper} {s.lower}</span>
          <span class="muted">{s.sound.canonical}</span>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Соседние буквы в алфавитном порядке (docs/09-navigation.md, 9.10) -->
  <nav class="pager" aria-label={t("letter.neighbours")}>
    {#if prev}<a href={hrefOf({ name: "letter", id: prev.id })}><span aria-hidden="true">‹</span> <span class="hy">{prev.upper}</span></a>{:else}<span></span>{/if}
    {#if next}<a href={hrefOf({ name: "letter", id: next.id })}><span class="hy">{next.upper}</span> <span aria-hidden="true">›</span></a>{/if}
  </nav>
{:else}
  <NotFound />
{/if}

<style>
  .card {
    padding: 20px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    text-align: center;
  }
  .glyphs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px 28px;
  }
  .print {
    font-size: calc(72px * var(--glyph-scale));
    line-height: 1.15;
  }
  .hand {
    display: flex;
    color: var(--text);
  }
  .name {
    margin-top: 8px;
    color: var(--muted);
  }
  .sound {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 4px 10px;
    margin-top: 6px;
  }
  .tr {
    color: var(--accent);
    font-size: 26px;
    font-weight: 600;
  }
  .ipa {
    color: var(--muted);
    font-size: 14px;
  }
  .notes {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--accent-soft);
    font-size: 15px;
  }
  .notes p {
    margin: 0;
  }
  .notes p + p {
    margin-top: 6px;
  }
  h2 {
    margin: 22px 4px 8px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .words {
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    list-style: none;
  }
  .word {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line);
  }
  .word:last-child {
    border-bottom: 0;
  }
  .pic {
    flex: none;
    width: 44px;
    height: 44px;
  }
  .big {
    font-size: calc(24px * var(--glyph-scale));
    line-height: 1.25;
  }
  mark {
    border-radius: 4px;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
  .similar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .similar a {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-height: var(--tap);
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 20px;
    text-decoration: none;
  }
  .similar .muted {
    font-size: 15px;
  }
  .pager {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  .pager a {
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 6px;
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
