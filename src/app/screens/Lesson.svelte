<script lang="ts">
  import { content, letterById, wordById } from "../../core/content";
  import { alphabetLessons, lessonLetters, lessonStatus, readableWords } from "../../core/course";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startLesson } from "../../session/start";
  import { app } from "../state.svelte";
  import NotFound from "./NotFound.svelte";

  // Экран урока перед началом (docs/09-navigation.md, 9.5).
  let { id }: { id: string } = $props();

  const lessons = alphabetLessons(content);
  const index = $derived(lessons.findIndex((l) => l.id === id));
  const lesson = $derived(lessons[index]);
  const status = $derived(index >= 0 ? lessonStatus(app.progress, lessons, index) : "locked");
  const letters = $derived(lesson ? lessonLetters(lesson).map((l) => letterById(l)!) : []);
  // Слова, которые откроются после урока
  const newWords = $derived.by(() => {
    if (index < 0) return [];
    const before = new Set(readableWords(content, lessons.slice(0, index).flatMap(lessonLetters)));
    return readableWords(content, lessons.slice(0, index + 1).flatMap(lessonLetters)).filter((w) => !before.has(w));
  });

  function unlock() {
    if (!confirm(t("lesson.unlockConfirm"))) return;
    app.unlockUpTo(index);
  }
</script>

{#if lesson}
  <ScreenHeader title={t("lessons.lesson", { n: index + 1 })} backTo="#/lessons" />
  <div class="card">
    <p class="name">{lesson.title}</p>
    <div class="letters hy" lang="hy">
      {#each letters as l (l.id)}<span>{l.upper}<small>{l.lower}</small></span>{/each}
    </div>
    <p class="muted">{t("lesson.duration")}</p>
  </div>

  {#if newWords.length}
    <p class="words-title">{t("lesson.newWords", { n: newWords.length })}</p>
    <p class="words hy" lang="hy">{newWords.slice(0, 8).map((w) => wordById(w)!.hy).join(" · ")}</p>
  {/if}

  {#if status === "locked"}
    <p class="locked">{t("lesson.locked", { n: index })}</p>
    <button class="btn" onclick={unlock}>{t("lesson.unlock")}</button>
  {:else}
    <button class="btn primary" onclick={() => startLesson(index)}>
      {status === "done" ? t("lesson.again") : t("lesson.start")}
    </button>
  {/if}
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
  .name {
    margin: 0 0 8px;
    font-weight: 600;
  }
  .letters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 18px;
    font-size: calc(44px * var(--glyph-scale));
  }
  small {
    margin-left: 2px;
    color: var(--muted);
    font-size: 0.7em;
  }
  .muted {
    margin: 8px 0 0;
  }
  .words-title {
    margin: 20px 4px 4px;
    color: var(--muted);
    font-size: 14px;
  }
  .words {
    margin: 0 4px;
    font-size: 20px;
  }
  .locked {
    margin: 20px 4px 8px;
  }
  .btn {
    width: 100%;
    min-height: 56px;
    margin-top: 20px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 17px;
    font-weight: 600;
  }
  .btn.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-text);
  }
</style>
