<script lang="ts">
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";

  // Прототип v0.1 лежит в корне сайта, пока новое приложение открывается по /next/.
  const prototypeHref = import.meta.env.BASE_URL.endsWith("/next/") ? `${import.meta.env.BASE_URL}../` : null;

  const learned = 0; // появится вместе с уроками (этап 3)
  const upcoming = ["sectionReading", "sectionWords", "sectionPhrases"];
</script>

<div class="hero">
  <div class="logo hy">{t("app.name")}</div>
  <div class="muted">{t("app.subtitle")}</div>
</div>

<Card>
  <div class="section-head">
    <h2>{t("home.sectionAlphabet")}</h2>
    <span class="badge">{t("common.inDevelopment")}</span>
  </div>
  <div class="bar" aria-hidden="true"><div style:width="{(learned / 39) * 100}%"></div></div>
  <p class="muted small">{t("home.lettersLearned", { n: learned })}</p>
  <p>{t("home.devNote")}</p>
  {#if prototypeHref}
    <a class="primary" href={prototypeHref}>{t("home.openPrototype")}</a>
  {/if}
</Card>

<Card title={t("home.sections")} padded={false}>
  <ul class="sections">
    <li><span>{t("home.sectionAlphabet")}</span><span class="muted small">{t("common.inDevelopment")}</span></li>
    {#each upcoming as key (key)}
      <li class="soon"><span>{t(`home.${key}`)}</span><span class="small">{t("common.soon")}</span></li>
    {/each}
  </ul>
</Card>

<style>
  .hero {
    padding: 8px 4px 20px;
  }
  .logo {
    color: var(--accent);
    font-size: 34px;
    font-weight: 600;
    line-height: 1.2;
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 20px;
  }
  .badge {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 13px;
    font-weight: 500;
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
  .primary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
    text-decoration: none;
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
  .sections li:last-child {
    border-bottom: 0;
  }
  .soon {
    color: var(--muted);
  }
</style>
