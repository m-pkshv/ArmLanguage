<script lang="ts">
  import { content } from "../../core/content";
  import { knownLetters } from "../../core/course";
  import type { MatchKind } from "../../core/session/types";
  import { formatTime } from "../../exercises/matchPairs";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startMatch } from "../../session/start";
  import { app } from "../state.svelte";

  // «Найди пары» в «Практике» (docs/02-features.md): выбор вида пар, рекорды, три поля подряд.
  const KINDS: { kind: MatchKind; sample: string }[] = [
    { kind: "sound", sample: "Ձ ↔ дз" },
    { kind: "case", sample: "Ձ ↔ ձ" },
    { kind: "handwriting", sample: "ձ ↔ ✍" },
  ];
  const enough = $derived(knownLetters(app.progress, content).length >= 4);
</script>

<ScreenHeader title={t("match.title")} backTo="#/practice" />
<p class="muted intro">{t("match.intro")}</p>

{#if !enough}
  <p class="muted">{t("practice.needLesson")}</p>
{:else}
  <ul class="list">
    {#each KINDS as k (k.kind)}
      {@const best = app.progress.games[k.kind]?.bestMs}
      <li>
        <button class="row" onclick={() => startMatch(k.kind)}>
          <span class="sample hy" lang="hy">{k.sample}</span>
          <span class="info">
            <span>{t(`match.${k.kind}`)}</span>
            <span class="muted small">{best ? t("match.record", { time: formatTime(best) }) : t("match.noRecord")}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </li>
    {/each}
  </ul>
  <p class="muted small hint">{t("match.recordHint")}</p>
{/if}

<style>
  .intro {
    margin: 0 4px 16px;
    font-size: 14px;
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
  .list li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 64px;
    padding: 8px 16px;
    border: 0;
    background: none;
    color: var(--text);
    font: inherit;
    text-align: left;
  }
  .sample {
    min-width: 86px;
    font-size: 20px;
  }
  .info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
  }
  .small {
    font-size: 13px;
  }
  .hint {
    margin: 12px 4px;
  }
</style>
