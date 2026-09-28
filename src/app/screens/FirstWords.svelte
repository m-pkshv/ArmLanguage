<script lang="ts">
  import { content } from "../../core/content";
  import { firstWordsOpen, seenItem, themeDone, themeItems, themes } from "../../core/words";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startFinalTest, startWordsReview } from "../../session/start";
  import { wordsDue } from "../../session/wordPlan";
  import { hrefOf } from "../routes";
  import { app, today } from "../state.svelte";

  // Раздел «Первые слова»: список тем (docs/10-first-words.md). Открывается после 8-го урока алфавита.
  const list = themes(content);
  const p = $derived(app.progress);
  const open = $derived(firstWordsOpen(p, content));
  const due = $derived(wordsDue(content, p, today()));
  // сколько слов и фраз уже встречалось — для «Моих слов»
  const seen = $derived(new Set(list.flatMap(themeItems).filter((id) => seenItem(p, id))).size);
</script>

<ScreenHeader title={t("words.title")} backTo="#/" />

{#if !open}
  <p class="muted intro">{t("words.locked")}</p>
  <!-- знающие буквы открывают раздел итоговым тестом (docs/10-first-words.md, 10.2); вид — как у главной кнопки -->
  <button class="review" onclick={startFinalTest}>{t("words.toFinal")}</button>
  <a class="link" href="#/lessons">{t("words.toLessons")}</a>
{:else}
  <p class="muted intro">{t("words.intro")}</p>
  {#if due}
    <button class="review" onclick={startWordsReview}>{t("words.review", { n: due })}</button>
  {/if}
  {#if seen}
    <a class="mine" href="#/words/my"><span>📖 {t("words.mine", { n: seen })}</span><span aria-hidden="true">›</span></a>
  {/if}
  <ul class="themes">
    {#each list as theme (theme.id)}
      {@const done = p.lessons ? theme.lessons.filter((l) => p.lessons[l.id]).length : 0}
      <li>
        {#if theme.status === "available"}
          <a class="theme" href={hrefOf({ name: "theme", id: theme.id })}>
            <span class="emoji" aria-hidden="true">{theme.emoji}</span>
            <span class="body">
              <span class="title">{theme.title}</span>
              <span class="meta">
                {#if p.themeTests[theme.id]?.passedAt}🏆 {t("words.passed")}{:else if themeDone(p, theme)}{t("words.testReady")}{:else}{t("words.lessons", { done, total: theme.lessons.length })}{/if}
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </a>
        {:else}
          <div class="theme soon">
            <span class="emoji" aria-hidden="true">{theme.emoji}</span>
            <span class="body"><span class="title">{theme.title}</span><span class="meta">{t("common.soon")}</span></span>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  <!-- Заглушка: список тем будет пополняться (docs/10-first-words.md, 10.3) -->
  <p class="more">🆕 {t("words.moreThemes")}</p>
{/if}

<style>
  .intro {
    margin: 0 4px 16px;
    font-size: 14px;
  }
  .link {
    color: var(--accent);
  }
  .review {
    width: 100%;
    min-height: var(--tap);
    margin-bottom: 12px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font: inherit;
    font-weight: 600;
  }
  .mine {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--tap);
    margin-bottom: 12px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
  }
  .themes {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .theme {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    text-decoration: none;
  }
  .theme.soon {
    opacity: 0.55;
    box-shadow: none;
  }
  .emoji {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--surface-2);
    font-size: 24px;
  }
  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
  }
  .title {
    font-weight: 600;
  }
  .meta {
    color: var(--muted);
    font-size: 14px;
  }
  .more {
    margin: 16px 0 0;
    padding: 14px;
    border: 1px dashed var(--line);
    border-radius: var(--radius-lg);
    color: var(--muted);
    font-size: 14px;
    text-align: center;
  }
  /* Главная кнопка: нажата и неактивна — явными цветами, без прозрачности (docs/11-design.md) */
  .review:active:not(:disabled) {
    border-color: var(--accent-pressed);
    background: var(--accent-pressed);
  }
  .review:disabled {
    border-color: transparent;
    background: var(--surface-2);
    color: var(--muted);
    opacity: 1;
  }
</style>
