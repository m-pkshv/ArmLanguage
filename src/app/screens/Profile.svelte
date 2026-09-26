<script lang="ts">
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ListLink from "../../ui/ListLink.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { toast } from "../../ui/Toast.svelte";
  import { app } from "../state.svelte";

  // Сброс — с двойным подтверждением (docs/09-navigation.md, 9.12).
  function reset() {
    if (!confirm(t("profile.resetConfirm1"))) return;
    if (!confirm(t("profile.resetConfirm2"))) return;
    app.resetProgress();
    toast.show(t("profile.resetDone"));
  }
</script>

<ScreenHeader title={t("profile.title")} />

<Card padded={false}>
  <ListLink disabled hint={t("common.soon")}>{t("profile.stats")}</ListLink>
  <ListLink href="#/settings">{t("profile.settings")}</ListLink>
  <ListLink href="#/backup">{t("profile.backup")}</ListLink>
  <ListLink href="#/about">{t("profile.about")}</ListLink>
  <ListLink href="#/credits">{t("profile.credits")}</ListLink>
</Card>

<Card padded={false}>
  <ListLink danger onclick={reset}>{t("profile.reset")}</ListLink>
</Card>
