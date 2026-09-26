<script lang="ts">
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
</script>

<ScreenHeader title={t("practice.title")} />
<Card>
  <p class="muted">{t("practice.hint")}</p>
</Card>

<style>
  p {
    margin: 0;
  }
</style>
