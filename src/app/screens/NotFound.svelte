<script lang="ts">
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
</script>

<ScreenHeader title={t("notFound.title")} />
<Card>
  <a href="#/">{t("notFound.home")}</a>
</Card>
