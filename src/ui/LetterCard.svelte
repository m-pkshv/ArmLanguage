<script lang="ts">
  import { assetUrl, letterById, wordById } from "../core/content";
  import type { Letter, Word } from "../core/content/types";
  import { highlightSegments } from "../core/text/armenian";
  import { t } from "../i18n";
  import Handwriting from "./Handwriting.svelte";

  // Карточка буквы: используется в справочнике, при знакомстве с буквой в уроке и в панели результата.
  // compact — без списка похожих букв и с двумя словами (экран знакомства).
  let {
    letter,
    showIpa = false,
    compact = false,
    similarHref,
  }: { letter: Letter; showIpa?: boolean; compact?: boolean; similarHref?: (id: string) => string } = $props();

  const examples = $derived(
    letter.words
      .map(wordById)
      .filter((w): w is Word => !!w)
      .slice(0, compact ? 2 : undefined),
  );
  const similar = $derived(
    compact ? [] : [...new Set([...letter.confusable.sound, ...letter.confusable.shape])].map(letterById).filter((l) => !!l),
  );
</script>

<section class="card head">
  <div class="glyphs">
    <div class="print hy" lang="hy">
      {#if letter.upper !== letter.lower}{letter.upper}{/if}
      {letter.lower}
    </div>
    {#if letter.handwriting}
      <div class="hand" title={t("letter.handwritten")}>
        {#if letter.handwriting.upper}<Handwriting file={letter.handwriting.upper} label={letter.upper} height={compact ? 80 : 96} />{/if}
        <Handwriting file={letter.handwriting.lower} label={letter.lower} height={compact ? 80 : 96} />
      </div>
    {/if}
  </div>
  <div class="name">
    «{letter.name.ru}» · <span class="hy" lang="hy">{letter.name.hy}</span>
  </div>
  <div class="sound">
    <span class="tr">{letter.sound.canonical}</span>
    {#if letter.sound.ru !== letter.sound.canonical}<span>{letter.sound.ru}</span>{/if}
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
      {#if similarHref}
        <a href={similarHref(s.id)}><span class="hy" lang="hy">{s.upper} {s.lower}</span><span class="muted">{s.sound.canonical}</span></a>
      {:else}
        <span class="chip"><span class="hy" lang="hy">{s.upper} {s.lower}</span><span class="muted">{s.sound.canonical}</span></span>
      {/if}
    {/each}
  </div>
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
  .similar a,
  .chip {
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
</style>
