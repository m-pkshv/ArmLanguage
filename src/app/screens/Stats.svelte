<script lang="ts">
  import { content, LETTERS, letterById } from "../../core/content";
  import type { ExerciseId } from "../../core/session/types";
  import { activity, letterLevel, summary, topConfusions, type MapView } from "../../core/stats";
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startPractice } from "../../session/start";
  import { hrefOf } from "../routes";
  import { app, today } from "../state.svelte";

  // Статистика (docs/02-features.md, 2.7): итоги, карта алфавита, частые путаницы, активность.
  const day = today();
  let view = $state<MapView>("main");

  const sum = $derived(summary(app.progress, content, day));
  const confusions = $derived(topConfusions(app.progress));
  const act = $derived(activity(app.progress, day));

  // Короткая тренировка на две спутанные буквы
  const PAIR_TYPES: ExerciseId[] = ["letter-to-sound", "sound-to-letter", "confusable-pair", "case-match"];
  const trainPair = (a: string, b: string) => startPractice([a, b], PAIR_TYPES, 10, undefined);

  const glyph = (id: string) => letterById(id)!.upper;
  const VIEWS: { value: MapView; label: string }[] = [
    { value: "main", label: t("stats.viewMain") },
    { value: "read", label: t("stats.viewRead") },
    { value: "handwriting", label: t("stats.viewHandwriting") },
    { value: "case", label: t("stats.viewCase") },
  ];
  const WEEKDAYS = ["пн", "", "ср", "", "пт", "", "вс"];
</script>

<ScreenHeader title={t("stats.title")} backTo="#/profile" />

<div class="tiles">
  <div class="tile"><b>{sum.learned}</b><span>{t("stats.learned", { total: content.letters.length })}</span></div>
  <div class="tile"><b>{sum.learning}</b><span>{t("stats.learning")}</span></div>
  <div class="tile">
    <b>{sum.days}</b><span>{t("stats.days")}{#if sum.streak > 1}<br />{t("stats.streak", { n: sum.streak })}{/if}</span>
  </div>
  <div class="tile">
    <b>{sum.accuracy === null ? "—" : `${Math.round(sum.accuracy * 100)}%`}</b><span>{t("stats.accuracy", { n: sum.answers })}</span>
  </div>
</div>

<Card title={t("stats.mapTitle")}>
  <!-- Кнопки, а не переключатель в одну строку: четыре подписи не помещаются в ширину телефона -->
  <div class="chips" role="radiogroup" aria-label={t("stats.mapTitle")}>
    {#each VIEWS as v (v.value)}
      <button class="chip" role="radio" aria-checked={view === v.value} class:on={view === v.value} onclick={() => (view = v.value)}>{v.label}</button>
    {/each}
  </div>
  <div class="map">
    {#each LETTERS as letter (letter.id)}
      {@const level = letterLevel(app.progress, letter.id, view)}
      <a
        class="cell hy"
        lang="hy"
        class:new={level === null}
        class:strong={level !== null && level >= 3}
        style:--mix="{level === null ? 0 : 18 + level * 15}%"
        href={hrefOf({ name: "letter", id: letter.id })}
        aria-label={letter.name.ru}>{letter.upper === letter.lower || letter.id === "yev" ? letter.lower : letter.upper}</a
      >
    {/each}
  </div>
  <div class="legend">
    <span><i class="cell new"></i>{t("stats.legendNew")}</span>
    <span><i class="cell" style:--mix="33%"></i>{t("stats.legendStarted")}</span>
    <span><i class="cell strong" style:--mix="93%"></i>{t("stats.legendLearned")}</span>
  </div>
</Card>

<Card title={t("stats.confusionsTitle")}>
  {#if confusions.length}
    <ul class="conf">
      {#each confusions as c (c.a + c.b)}
        <li>
          <span class="pair hy" lang="hy">{glyph(c.a)} ↔ {glyph(c.b)}</span>
          <span class="muted">{t("stats.errors", { n: c.count })}</span>
          <button class="train" onclick={() => trainPair(c.a, c.b)}>{t("stats.train")}</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="muted">{t("stats.noConfusions")}</p>
  {/if}
</Card>

<Card title={t("stats.activityTitle")}>
  <div class="cal">
    <div class="wd">
      {#each WEEKDAYS as w, i (i)}<span>{w}</span>{/each}
    </div>
    {#each act.columns as col, w (w)}
      <div class="week">
        {#each col as d (d.day)}
          <span class="day" class:future={d.future} data-level={d.level} title="{d.day}: {d.answers}"></span>
        {/each}
      </div>
    {/each}
  </div>
  <p class="muted small">{t("stats.thisWeek", { n: act.thisWeek })}</p>
</Card>

<style>
  .tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .tile b {
    font-size: 28px;
    line-height: 1.1;
  }
  .tile span {
    color: var(--muted);
    font-size: 13px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
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
  .map {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 6px;
  }
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    border-radius: 8px;
    background: color-mix(in srgb, var(--good) var(--mix), var(--surface-2));
    color: var(--text);
    font-size: calc(20px * var(--glyph-scale));
    text-decoration: none;
  }
  .cell.new {
    background: var(--surface-2);
    color: var(--muted);
  }
  .cell.strong {
    color: var(--bg);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 12px;
    color: var(--muted);
    font-size: 13px;
  }
  .legend span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .legend .cell {
    width: 16px;
    border-radius: 4px;
  }
  .conf {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .conf li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
  }
  .conf li + li {
    border-top: 1px solid var(--line);
  }
  .pair {
    min-width: 72px;
    font-size: 22px;
  }
  .conf .muted {
    flex: 1;
    font-size: 14px;
  }
  .train {
    padding: 6px 12px;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: 14px;
  }
  .cal {
    display: flex;
    gap: 3px;
  }
  .wd,
  .week {
    display: grid;
    grid-template-rows: repeat(7, 1fr);
    gap: 3px;
  }
  .week {
    flex: 1;
  }
  .wd span {
    height: 100%;
    padding-right: 4px;
    color: var(--muted);
    font-size: 10px;
    line-height: 1;
    display: flex;
    align-items: center;
  }
  .day {
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--surface-2);
  }
  .day[data-level="1"] {
    background: color-mix(in srgb, var(--good) 30%, var(--surface-2));
  }
  .day[data-level="2"] {
    background: color-mix(in srgb, var(--good) 50%, var(--surface-2));
  }
  .day[data-level="3"] {
    background: color-mix(in srgb, var(--good) 72%, var(--surface-2));
  }
  .day[data-level="4"] {
    background: var(--good);
  }
  .day.future {
    background: none;
  }
  .small {
    margin: 10px 0 0;
    font-size: 13px;
  }
</style>
