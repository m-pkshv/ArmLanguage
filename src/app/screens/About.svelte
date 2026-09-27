<script lang="ts">
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { RELEASES, shortVersion } from "../whatsNew";
  import WhatsNew from "./WhatsNew.svelte";

  const repo = "https://github.com/m-pkshv/ArmLanguage";
  const version = shortVersion(__APP_VERSION__);
  const release = RELEASES.find((r) => r.version === version) ?? RELEASES[RELEASES.length - 1];
  let showNew = $state(false);
</script>

<ScreenHeader title={t("about.title")} backTo="#/profile" />

<Card>
  <p>{t("about.text")}</p>
  <h2>{t("about.privacyTitle")}</h2>
  <p>{t("about.privacy")}</p>
  <h2>{t("about.licensesTitle")}</h2>
  <p>{t("about.licenses")}</p>
  <p><a href={repo} target="_blank" rel="noopener">{t("about.source")}</a></p>
  <p class="muted small">
    {t("about.version", { v: version })}
    {#if release}· <button class="link" onclick={() => (showNew = true)}>{t("about.whatsNew")}</button>{/if}
  </p>
</Card>

{#if showNew && release}<WhatsNew {release} onclose={() => (showNew = false)} />{/if}

<style>
  h2 {
    margin: 20px 0 6px;
    font-size: 17px;
  }
  p {
    margin: 0 0 10px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  .small {
    font-size: 14px;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
  }
</style>
