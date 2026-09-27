<script lang="ts">
  import { assetUrl, content } from "../../core/content";
  import { boxOfItem } from "../../core/progress/knowledge";
  import { seenItem, studyItem, themeItems, themes } from "../../core/words";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { app } from "../state.svelte";

  // «Мои слова» (docs/10-first-words.md, 10.6): все встреченные слова и фразы, поиск по-русски и по-армянски.
  type Filter = "all" | "word" | "phrase";
  let filter = $state<Filter>("all");
  let query = $state("");

  const p = $derived(app.progress);
  // порядок — как в темах; элемент из нескольких тем — один раз
  const all = $derived(
    [...new Set(themes(content).flatMap(themeItems))]
      .filter((id) => seenItem(p, id))
      .map((id) => {
        const item = studyItem(content, id);
        // уверенность: средняя коробка понимания и вспоминания, 0–1 («выучено» — от коробки 3)
        const conf = Math.min(1, (boxOfItem(p, id, "meaning") + boxOfItem(p, id, "produce")) / 2 / 3);
        return { item, conf };
      }),
  );
  const q = $derived(query.trim().toLowerCase());
  const shown = $derived(
    all.filter(
      ({ item }) =>
        (filter === "all" || item.kind === filter) &&
        (!q || item.ru.toLowerCase().includes(q) || item.hy.toLocaleLowerCase("hy").includes(q) || item.pronunciation.includes(q)),
    ),
  );
  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: t("myWords.all") },
    { value: "word", label: t("myWords.words") },
    { value: "phrase", label: t("myWords.phrases") },
  ];
</script>

<ScreenHeader title={t("myWords.title")} backTo="#/words" />

{#if !all.length}
  <p class="muted empty">{t("myWords.empty")}</p>
{:else}
  <input class="search" type="search" placeholder={t("myWords.search")} bind:value={query} />
  <div class="chips" role="radiogroup" aria-label={t("myWords.title")}>
    {#each FILTERS as f (f.value)}
      <button class="chip" role="radio" aria-checked={filter === f.value} class:on={filter === f.value} onclick={() => (filter = f.value)}>{f.label}</button>
    {/each}
  </div>
  <p class="muted small">{t("myWords.count", { n: shown.length, total: all.length })}</p>
  <ul class="list">
    {#each shown as { item, conf } (item.id)}
      <li>
        {#if item.image}<img class="word-pic" src={assetUrl(item.image.file)} alt="" width="40" height="40" loading="lazy" />{:else}<span class="nopic">💬</span>{/if}
        <span class="body">
          <span class="hy" lang="hy">{item.hy}</span>
          <span class="muted">[{item.pronunciation}] — {item.ru}</span>
        </span>
        <span class="conf" title={t("myWords.confidence")}><span style:width="{conf * 100}%"></span></span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty {
    margin: 0 4px;
  }
  .search {
    box-sizing: border-box;
    width: 100%;
    min-height: var(--tap);
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 16px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 4px;
  }
  .chip {
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 14px;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
  .small {
    margin: 6px 4px;
    font-size: 13px;
  }
  .list {
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    list-style: none;
  }
  .list li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
  }
  .list li + li {
    border-top: 1px solid var(--line);
  }
  .nopic {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    font-size: 22px;
  }
  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .hy {
    font-family: var(--font-hy);
    font-size: 19px;
  }
  .body .muted {
    font-size: 13px;
  }
  .conf {
    flex: none;
    width: 44px;
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--surface-2);
  }
  .conf span {
    display: block;
    height: 100%;
    background: var(--good);
  }
</style>
