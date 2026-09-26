<script lang="ts">
  import { LETTERS, letterById } from "../../core/content";
  import { itemOf, letterState, MAIN_SKILLS } from "../../core/progress/knowledge";
  import { feedbackUrl } from "../../config";
  import { t } from "../../i18n";
  import LetterCard from "../../ui/LetterCard.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startLetterPractice } from "../../session/start";
  import { hrefOf } from "../routes";
  import { app } from "../state.svelte";
  import NotFound from "./NotFound.svelte";

  // Карточка буквы в справочнике (docs/02-features.md, 2.2 и docs/09-navigation.md, 9.10).
  let { id }: { id: string } = $props();

  const letter = $derived(letterById(id));
  const index = $derived(letter ? LETTERS.indexOf(letter) : -1);
  const prev = $derived(index > 0 ? LETTERS[index - 1] : undefined);
  const next = $derived(index >= 0 && index < LETTERS.length - 1 ? LETTERS[index + 1] : undefined);
  const state = $derived(letter ? letterState(app.progress, letter.id) : "new");
  const stats = $derived.by(() => {
    if (!letter) return null;
    const items = MAIN_SKILLS.map((s) => itemOf(app.progress, letter.id, s)).filter((i) => !!i);
    if (!items.length) return null;
    const due = items.map((i) => i.due).sort()[0]!;
    return { ok: items.reduce((a, i) => a + i.ok, 0), bad: items.reduce((a, i) => a + i.bad, 0), due };
  });
  const report = $derived(letter ? feedbackUrl(`letter · ${letter.id}`) : null);
  const dueText = (day: string) => new Date(`${day}T00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  // Свайп влево/вправо — к соседней букве (docs/09-navigation.md, 9.10).
  let startX = 0;
  function ontouchstart(e: TouchEvent) {
    startX = e.touches[0]!.clientX;
  }
  function ontouchend(e: TouchEvent) {
    const dx = e.changedTouches[0]!.clientX - startX;
    if (Math.abs(dx) < 80) return;
    const target = dx < 0 ? next : prev;
    if (target) location.replace(hrefOf({ name: "letter", id: target.id }));
  }
</script>

{#if letter}
  <ScreenHeader title={t("alphabet.title")} backTo="#/alphabet" />
  <!-- Свайп — дополнение к кнопкам ‹ › внизу, поэтому отдельная роль не нужна -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div {ontouchstart} {ontouchend}>
    <LetterCard {letter} showIpa={app.progress.settings.showIpa} similarHref={(sid) => hrefOf({ name: "letter", id: sid })} />
  </div>

  <section class="stats">
    <p>
      <span class="state {state}">{t(`letter.state.${state}`)}</span>
      {#if stats}· {t("letter.stats", { ok: stats.ok, bad: stats.bad })} · {t("letter.nextReview", { date: dueText(stats.due) })}{/if}
    </p>
    <button class="train" onclick={() => startLetterPractice(letter.id)}>{t("letter.train")}</button>
    {#if report}<a class="report" href={report} target="_blank" rel="noopener">{t("session.report")}</a>{/if}
  </section>

  <nav class="pager" aria-label={t("letter.neighbours")}>
    {#if prev}<a href={hrefOf({ name: "letter", id: prev.id })}><span aria-hidden="true">‹</span> <span class="hy">{prev.upper}</span></a>{:else}<span></span>{/if}
    {#if next}<a href={hrefOf({ name: "letter", id: next.id })}><span class="hy">{next.upper}</span> <span aria-hidden="true">›</span></a>{/if}
  </nav>
{:else}
  <NotFound />
{/if}

<style>
  .stats {
    margin-top: 20px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }
  .stats p {
    margin: 0 0 12px;
    color: var(--muted);
    font-size: 14px;
  }
  .state {
    font-weight: 600;
  }
  .state.learned {
    color: var(--good);
  }
  .state.learning {
    color: var(--accent);
  }
  .train {
    width: 100%;
    min-height: 50px;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: none;
    color: var(--accent);
    font-weight: 600;
  }
  .report {
    display: block;
    margin-top: 10px;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
  }
  .pager {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  .pager a {
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 6px;
    min-width: 72px;
    min-height: var(--tap);
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 22px;
    text-decoration: none;
  }
</style>
