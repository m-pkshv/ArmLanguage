<script lang="ts">
  // Выбор цветовой темы: три карточки-образца (docs/05-ui-mobile.md, 5.5; макет — docs/11-design.md,
  // «Превью в Настройках»). Карточка рисуется цветами своей темы, а не текущей — поэтому цвета здесь
  // приходят из src/app/palettes.ts, а не из переменных CSS. Светлый или тёмный образец — как сейчас на экране.
  import { MediaQuery } from "svelte/reactivity";
  import type { Palette, Theme } from "../core/progress/types";
  import { t } from "../i18n";
  import { PALETTES } from "../app/palettes";
  import Icon from "./Icon.svelte";

  let { value, theme, onchange }: { value: Palette; theme: Theme; onchange: (value: Palette) => void } = $props();

  const systemDark = new MediaQuery("(prefers-color-scheme: dark)");
  const dark = $derived(theme === "dark" || (theme === "system" && systemDark.current));
  const labelId = `palette-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="field">
  <div class="label" id={labelId}>{t("settings.palette")}</div>
  <div class="cards" role="group" aria-labelledby={labelId}>
    {#each PALETTES as p (p.id)}
      {@const c = dark ? p.dark : p.light}
      <button
        class="card"
        class:selected={p.id === value}
        aria-pressed={p.id === value}
        style:--p-bg={c.bg}
        style:--p-surface={c.surface}
        style:--p-accent={c.accent}
        style:--p-good={c.good}
        style:--p-text={c.text}
        onclick={() => onchange(p.id)}
      >
        <span class="mini" aria-hidden="true">
          <span class="bar"></span>
          <span class="dot"></span>
        </span>
        <span class="name">{t(`settings.palette_${p.id}`)}</span>
        {#if p.id === value}<span class="check" aria-hidden="true"><Icon name="check" size={14} /></span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .field {
    padding: 14px 16px 16px;
    border-bottom: 1px solid var(--line);
  }
  .label {
    margin-bottom: 10px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    min-height: 132px;
    padding: 8px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: var(--p-bg);
    color: var(--p-text);
    text-align: left;
  }
  .card.selected {
    border-color: var(--accent);
  }
  .mini {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 8px;
    border-radius: 8px;
    background: var(--p-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
  .bar {
    height: 14px;
    border-radius: 4px;
    background: var(--p-accent);
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--p-good);
  }
  .name {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
  }
  .check {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--accent-text);
  }
</style>
