<script lang="ts">
  import credits from "../../../content/credits.json";
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";

  // Страница «Авторы и лицензии» (docs/04-content.md, 4.5 и docs/06-architecture.md, 6.15).
</script>

<ScreenHeader title={t("credits.title")} backTo="#/profile" />
<p class="muted intro">{t("credits.intro")}</p>

{#each credits as c (c.what)}
  <Card title={c.what}>
    <p><a href={c.url} target="_blank" rel="noopener">{c.source}</a></p>
    <p>{t("credits.author")}: {c.author}</p>
    <p>{t("credits.license")}: <a href={c.licenseUrl} target="_blank" rel="noopener">{c.license}</a></p>
    {#if c.changes}<p class="muted">{t("credits.changes")}: {c.changes}</p>{/if}
  </Card>
{/each}

<style>
  .intro {
    margin: 0 4px 16px;
    font-size: 14px;
  }
  p {
    margin: 0 0 6px;
  }
  p:last-child {
    margin: 0;
  }
</style>
