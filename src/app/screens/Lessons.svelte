<script lang="ts">
  import { content, letterById } from "../../core/content";
  import { alphabetLessons, lessonLetters, lessonStatus, readableWords } from "../../core/course";
  import { boxOf } from "../../core/progress/knowledge";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startFinalTest } from "../../session/start";
  import { hrefOf } from "../routes";
  import { app } from "../state.svelte";

  // Карта уроков (docs/09-navigation.md, 9.5).
  const lessons = alphabetLessons(content);
  const p = $derived(app.progress);
  const allDone = $derived(lessons.every((l) => p.lessons[l.id]));

  /** Сколько слов открывает урок: всего читаемых после него. */
  const wordsAfter = lessons.map((_, i) => readableWords(content, lessons.slice(0, i + 1).flatMap(lessonLetters)).length);

  /** Уверенность по буквам урока: средняя коробка основных навыков, 0–1. */
  function confidence(i: number): number {
    const ids = lessonLetters(lessons[i]!);
    const sum = ids.reduce((acc, id) => acc + Math.min(boxOf(p, id, "recognize"), boxOf(p, id, "recall")), 0);
    return Math.min(1, sum / ids.length / 3);
  }
</script>

<ScreenHeader title={t("lessons.title")} backTo="#/" />

<ol class="map">
  {#each lessons as lesson, i (lesson.id)}
    {@const status = lessonStatus(p, lessons, i)}
    <li>
      <a class="lesson {status}" href={hrefOf({ name: "lesson", id: lesson.id })}>
        <span class="num">{status === "done" ? "✓" : status === "locked" ? "🔒" : i + 1}</span>
        <span class="body">
          <span class="title">{t("lessons.lesson", { n: i + 1 })} · {lesson.title}</span>
          <span class="letters hy" lang="hy">{lessonLetters(lesson).map((id) => letterById(id)!.upper).join(" ")}</span>
          <span class="meta">
            {t("lessons.words", { n: wordsAfter[i]! })}
            {#if p.lessons[lesson.id]?.skipped}· {t("lessons.skipped")}{/if}
          </span>
          {#if status === "done"}
            <span class="conf" aria-label={t("lessons.confidence")}><span style:width="{confidence(i) * 100}%"></span></span>
          {/if}
        </span>
      </a>
    </li>
  {/each}
  <li>
    <button class="lesson final" class:locked={!allDone} disabled={!allDone} onclick={startFinalTest}>
      <span class="num">{p.finalTest?.passedAt ? "🏆" : "★"}</span>
      <span class="body">
        <span class="title">{t("lessons.final")}</span>
        <span class="meta">
          {#if p.finalTest}{t("lessons.finalBest", { n: Math.round(p.finalTest.bestScore * 100) })}{:else if allDone}{t("lessons.finalReady")}{:else}{t("lessons.finalLocked")}{/if}
        </span>
      </span>
    </button>
  </li>
</ol>

<style>
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
    text-align: left;
    text-decoration: none;
  }
  .lesson.current {
    border: 2px solid var(--accent);
  }
  .lesson.locked {
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
  .letters {
    font-size: 22px;
    letter-spacing: 0.08em;
  }
  .meta {
    color: var(--muted);
    font-size: 13px;
  }
  .conf {
    height: 6px;
    margin-top: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--line);
  }
  .conf span {
    display: block;
    height: 100%;
    background: var(--good);
  }
  .final {
    font: inherit;
  }
</style>
