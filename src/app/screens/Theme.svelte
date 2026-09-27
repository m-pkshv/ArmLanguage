<script lang="ts">
  import { content } from "../../core/content";
  import { firstWordsOpen, studyItem, themeById, themeDone, themeLessonStatus } from "../../core/words";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startThemeLesson, startThemeTest } from "../../session/start";
  import { THEME_PASS, THEME_TEST_SIZE } from "../../session/wordPlan";
  import { app } from "../state.svelte";
  import NotFound from "./NotFound.svelte";

  // Экран темы «Первых слов»: уроки по порядку и итоговое задание (docs/10-first-words.md, 10.6).
  let { id }: { id: string } = $props();
  const theme = $derived(themeById(content, id));
  const p = $derived(app.progress);
  const test = $derived(p.themeTests[id]);

  // первые слова урока — как подпись
  const preview = (items: string[]) =>
    items
      .filter((x) => x.startsWith("word:"))
      .slice(0, 4)
      .map((x) => studyItem(content, x).hy)
      .join(" · ");
</script>

{#if !theme || theme.status !== "available" || !firstWordsOpen(p, content)}
  <NotFound />
{:else}
  <ScreenHeader title={`${theme.emoji} ${theme.title}`} backTo="#/words" />
  <p class="muted draft">{t("words.draft")}</p>
  <ol class="map">
    {#each theme.lessons as lesson, i (lesson.id)}
      {@const status = themeLessonStatus(p, theme, i)}
      <li>
        <button class="lesson {status}" disabled={status === "locked"} onclick={() => startThemeLesson(theme.id, i)}>
          <span class="num">{status === "done" ? "✓" : status === "locked" ? "🔒" : i + 1}</span>
          <span class="body">
            <span class="title">{t("lessons.lesson", { n: i + 1 })} · {lesson.title}</span>
            <span class="words hy" lang="hy">{preview(lesson.newItems)}</span>
            <span class="meta">{t("words.lessonMeta", { n: lesson.newItems.length })}{#if status === "done"}{" · "}{t("words.again")}{/if}</span>
          </span>
        </button>
      </li>
    {/each}
    <li>
      <button class="lesson final" class:locked={!themeDone(p, theme)} disabled={!themeDone(p, theme)} onclick={() => startThemeTest(theme.id)}>
        <span class="num">{test?.passedAt ? "🏆" : "★"}</span>
        <span class="body">
          <span class="title">{t("words.test")}</span>
          <span class="meta">
            {#if test}{t("lessons.finalBest", { n: Math.round(test.bestScore * 100) })}{:else if themeDone(p, theme)}{t("words.testMeta", { n: THEME_TEST_SIZE, pct: THEME_PASS * 100 })}{:else}{t("words.testLocked")}{/if}
          </span>
        </span>
      </button>
    </li>
  </ol>
{/if}

<style>
  .draft {
    margin: 0 4px 12px;
    font-size: 13px;
  }
  .map {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .lesson {
    display: flex;
    gap: 14px;
    width: 100%;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    font: inherit;
    text-align: left;
  }
  .lesson.current {
    border: 2px solid var(--accent);
  }
  .lesson.locked,
  .lesson:disabled {
    opacity: 0.6;
  }
  .num {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--surface-2);
    font-weight: 600;
  }
  .done .num {
    background: var(--good-soft);
    color: var(--good);
  }
  .current .num {
    background: var(--accent);
    color: var(--accent-text);
  }
  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .title {
    font-weight: 600;
  }
  .words {
    font-size: 18px;
  }
  .meta {
    color: var(--muted);
    font-size: 14px;
  }
</style>
