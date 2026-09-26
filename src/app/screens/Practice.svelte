<script lang="ts">
  import { content } from "../../core/content";
  import { knownLetters } from "../../core/course";
  import { dueLetters } from "../../core/progress/knowledge";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startMixed, startReview } from "../../session/start";
  import { app, today } from "../state.svelte";

  // Практика (docs/09-navigation.md, 9.11). В V1 — повторение и своя тренировка.
  const known = $derived(knownLetters(app.progress, content));
  const due = $derived(dueLetters(app.progress, today(), known).length);
  const enough = $derived(known.length >= 4);
</script>

<ScreenHeader title={t("practice.title")} />

{#if !enough}
  <p class="muted">{t("practice.needLesson")}</p>
  <a class="btn" href="#/">{t("practice.toLessons")}</a>
{:else}
  <div class="tiles">
    <button class="tile" onclick={startReview} disabled={!due}>
      <span class="tt">{t("practice.review")}</span>
      <span class="sub">{due ? t("practice.reviewDue", { n: due }) : t("practice.reviewNone")}</span>
    </button>
    <a class="tile" href="#/practice/pairs">
      <span class="tt">{t("practice.pairs")}</span>
      <span class="sub">{t("practice.pairsSub")}</span>
    </a>
    <button class="tile" onclick={startMixed}>
      <span class="tt">{t("practice.mixed")}</span>
      <span class="sub hy" lang="hy">{t("practice.mixedSub")}</span>
    </button>
    <a class="tile" href="#/practice/custom">
      <span class="tt">{t("practice.custom")}</span>
      <span class="sub">{t("practice.customSub")}</span>
    </a>
  </div>
  <p class="muted soon">{t("practice.soon")}</p>
{/if}

<style>
  .tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 110px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    font: inherit;
    text-align: left;
    text-decoration: none;
  }
  .tile:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .tt {
    font-size: 17px;
    font-weight: 600;
  }
  .sub {
    color: var(--muted);
    font-size: 14px;
  }
  .soon {
    margin-top: 16px;
    font-size: 14px;
  }
  .btn {
    display: inline-block;
    margin-top: 12px;
    color: var(--accent);
  }
</style>
