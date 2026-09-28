<script lang="ts">
  import { content, letterById } from "../../core/content";
  import { alphabetLessons, knownLetters, lessonLetters, readableWords } from "../../core/course";
  import { daysBetween, toDay } from "../../core/dates";
  import { dueLetters, isLearned } from "../../core/progress/knowledge";
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import { isFirstRun, nextAction } from "../../session/next";
  import { dueStudyItems, firstWordsOpen, seenItem, studyItem, themeById, themeDone, themes } from "../../core/words";
  import { startFinalTest, startLesson, startMatch, startReview, startThemeLesson, startThemeTest } from "../../session/start";
  import { app, today } from "../state.svelte";
  import ConfusionHint from "./ConfusionHint.svelte";
  import InstallHint from "./InstallHint.svelte";

  // Главный экран «Учить» (docs/09-navigation.md, 9.3–9.4).
  const lessons = alphabetLessons(content);
  const day = today();

  const p = $derived(app.progress);
  const first = $derived(isFirstRun(p));
  const action = $derived(nextAction(p, content, day));
  const learned = $derived(content.letters.filter((l) => isLearned(p, l.id)).length);
  const known = $derived(knownLetters(p, content));
  const readable = $derived(readableWords(content, known).length);
  const due = $derived(dueLetters(p, day, known));
  // общее повторение букв и слов (docs/10-first-words.md, 10.6)
  const dueWords = $derived(dueStudyItems(content, p, day));
  const dueTotal = $derived(due.length + dueWords.length);
  const doneLessons = $derived(lessons.filter((l) => p.lessons[l.id]).length);
  // Подсказка про резервную копию — раз в неделю, когда уже есть что терять (docs/09-navigation.md, 9.13).
  const backupHint = $derived(
    doneLessons >= 1 && (!p.meta.lastBackupAt || daysBetween(toDay(new Date(p.meta.lastBackupAt)), day) >= 7),
  );
  const sections = content.course.sections;
  const wordsOpen = $derived(firstWordsOpen(p, content));
  // После алфавита (8 уроков и попытка итогового теста) главная карточка — «Первые слова» (docs/09-navigation.md, 9.4)
  const themeList = themes(content).filter((x) => x.status === "available");
  const themeWords = themeList.flatMap((x) => x.lessons.flatMap((l) => l.newItems)).filter((id) => id.startsWith("word:"));
  const wordsMode = $derived(wordsOpen && !!p.finalTest);
  const wordsSeen = $derived(wordsMode ? themeWords.filter((id) => seenItem(p, id)).length : 0);
  const themeNo = $derived(Math.min(themeList.filter((x) => themeDone(p, x) && p.themeTests[x.id]).length + 1, themeList.length));
  const themeTitle = (id: string) => themeById(content, id)!.title;

  const lettersOf = (i: number) => lessonLetters(lessons[i]!).map((id) => letterById(id)!.upper).join(" ");

  function go() {
    switch (action.kind) {
      case "resume":
        location.hash = "#/session";
        break;
      case "review":
        startReview();
        break;
      case "lesson":
        startLesson(action.index);
        break;
      case "final":
        startFinalTest();
        break;
      case "theme-lesson":
        startThemeLesson(action.themeId, action.index);
        break;
      case "theme-test":
        startThemeTest(action.themeId);
        break;
      case "practice":
        location.hash = "#/practice";
    }
  }

  const label = $derived.by(() => {
    switch (action.kind) {
      case "resume":
        return t(action.lesson ? "home.resumeLesson" : "home.resumeReview", { done: action.done, total: action.total });
      case "review":
        return t("home.review", { n: action.count });
      case "lesson":
        return t("home.lesson", { n: action.index + 1, letters: lettersOf(action.index) });
      case "final":
        return t("home.final");
      case "theme-lesson":
        return t("home.themeLesson", { theme: themeTitle(action.themeId), n: action.index + 1 });
      case "theme-test":
        return t("home.themeTest", { theme: themeTitle(action.themeId) });
      default:
        return t("home.practice");
    }
  });
</script>

{#if first}
  <!-- Первый запуск: первая буква меньше чем через 30 секунд (docs/09-navigation.md, 9.3) -->
  <div class="welcome">
    <div class="logo hy" lang="hy">{t("app.name")}</div>
    <p class="lead">{t("welcome.lead")}</p>
    <ul>
      <li>{t("welcome.p1")}</li>
      <li>{t("welcome.p2")}</li>
      <li>{t("welcome.p3")}</li>
    </ul>
    <button class="primary" onclick={() => startLesson(0)}>{t("welcome.start")}</button>
    <a class="link" href="#/lessons">{t("welcome.know")}</a>
    <button class="link" onclick={startFinalTest}>{t("welcome.knowAll")}</button>
  </div>
{:else}
  <div class="hero">
    <div class="logo hy" lang="hy">{t("app.name")}</div>
    <div class="muted">{t("app.subtitle")}</div>
  </div>

  {#if backupHint}
    <a class="hint" href="#/backup">{t("home.backupHint")}</a>
  {:else}
    <InstallHint show={doneLessons >= 2} />
  {/if}

  <Card>
    {#if wordsMode}
      <div class="section-head">
        <h2>{t("home.sectionWords")}</h2>
        <span class="muted small">{t("home.themeOf", { n: themeNo, total: themeList.length })}</span>
      </div>
      <div class="bar" aria-hidden="true"><div style:width="{(wordsSeen / themeWords.length) * 100}%"></div></div>
      <p class="muted small">{t("home.wordsSeen", { n: wordsSeen, total: themeWords.length })}</p>
    {:else}
      <div class="section-head">
        <h2>{t("home.sectionAlphabet")}</h2>
        <span class="muted small">{t("home.lessonOf", { n: Math.min(doneLessons + 1, lessons.length), total: lessons.length })}</span>
      </div>
      <div class="bar" aria-hidden="true"><div style:width="{(learned / content.letters.length) * 100}%"></div></div>
      <p class="muted small">{t("home.lettersLearned", { n: learned })} · {t("home.canRead", { n: readable })}</p>
    {/if}
    <button class="primary" onclick={go}>{label}</button>
  </Card>

  <ConfusionHint />

  {#if dueTotal}
    <Card title={t("home.dueTitle", { n: dueTotal })}>
      {#if due.length}
        <p class="due hy" lang="hy">{due.slice(0, 12).map((id) => letterById(id)!.upper).join(" ")}{due.length > 12 ? " …" : ""}</p>
      {/if}
      {#if dueWords.length}
        <p class="due-words hy" lang="hy">{dueWords.slice(0, 4).map((id) => studyItem(content, id).hy).join(" · ")}{dueWords.length > 4 ? " …" : ""}</p>
      {/if}
      {#if action.kind !== "review"}
        <button class="secondary" onclick={startReview}>{t("home.review", { n: dueTotal })}</button>
      {/if}
    </Card>
  {:else if doneLessons >= 1 && action.kind !== "resume"}
    <!-- Повторять нечего — можно поиграть (docs/09-navigation.md, 9.14) -->
    <Card title={t("home.allDone")}>
      <button class="secondary" onclick={() => startMatch("sound")}>{t("home.playMatch")}</button>
    </Card>
  {/if}

  <Card padded={false}>
    {#if wordsMode}
      <a class="row" href="#/words"><span>{t("home.allThemes")}</span><span aria-hidden="true">›</span></a>
    {/if}
    <a class="row" class:line={wordsMode} href="#/lessons"><span>{wordsMode ? t("home.alphabetMap") : t("home.lessonsMap")}</span><span aria-hidden="true">›</span></a>
  </Card>

  <Card title={t("home.sections")} padded={false}>
    <ul class="sections">
      {#each sections as s (s.id)}
        {#if s.id === "first-words" && s.status === "available"}
          <!-- «Первые слова» — после 8-го урока алфавита или сдачи итогового теста (docs/10-first-words.md, 10.2) -->
          <li class="link-row">
            <a href="#/words">
              <span>{s.title}</span>
              <span class="small">{wordsOpen ? t("home.themesCount", { n: (s.themes ?? []).filter((x) => x.status === "available").length }) : t("home.afterLesson8")} ›</span>
            </a>
          </li>
        {:else}
          <li class:soon={s.status !== "available"}>
            <span>{s.title}</span>
            <span class="small">{s.status === "available" ? t("home.lessonsCount", { n: s.lessons.length }) : t("common.soon")}</span>
          </li>
        {/if}
      {/each}
    </ul>
  </Card>
{/if}

<style>
  .welcome {
    padding: 32px 4px 16px;
  }
  .welcome ul {
    margin: 16px 0 28px;
    padding-left: 20px;
  }
  .welcome li {
    margin-bottom: 6px;
  }
  .lead {
    margin: 12px 0 0;
    font-size: 19px;
  }
  .link {
    display: block;
    margin-top: 16px;
    color: var(--muted);
    text-align: center;
  }
  button.link {
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    text-decoration: var(--link-decoration);
  }
  .hero {
    padding: 8px 4px 16px;
  }
  .logo {
    color: var(--accent);
    font-size: 34px;
    font-weight: 600;
    line-height: 1.2;
  }
  .hint {
    display: block;
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--accent-soft);
    color: var(--text);
    font-size: 14px;
    text-decoration: none;
  }
  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 20px;
  }
  .bar {
    height: 8px;
    margin: 14px 0 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--line);
  }
  .bar div {
    height: 100%;
    background: var(--good);
  }
  .small {
    font-size: 14px;
  }
  p {
    margin: 0 0 12px;
  }
  .primary,
  .secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 56px;
    padding: 0 16px;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font-size: 17px;
    font-weight: 600;
  }
  .secondary {
    min-height: 48px;
    background: none;
    color: var(--accent);
    font-size: 15px;
  }
  .due {
    font-size: 24px;
    letter-spacing: 0.08em;
  }
  .due-words {
    font-size: 18px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 56px;
    padding: 0 16px;
    color: var(--text);
    text-decoration: none;
  }
  .row.line {
    border-top: 1px solid var(--line);
  }
  .sections {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sections li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid var(--line);
  }
  .sections li.link-row {
    padding: 0;
  }
  .link-row a {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    min-height: 52px;
    padding: 0 16px;
    color: var(--text);
    text-decoration: none;
  }
  .sections li:last-child {
    border-bottom: 0;
  }
  .soon {
    color: var(--muted);
  }
  /* Главная кнопка: нажата и неактивна — явными цветами, без прозрачности (docs/11-design.md) */
  .primary:active:not(:disabled) {
    border-color: var(--accent-pressed);
    background: var(--accent-pressed);
  }
  .primary:disabled {
    border-color: transparent;
    background: var(--surface-2);
    color: var(--muted);
    opacity: 1;
  }
</style>
