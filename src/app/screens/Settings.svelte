<script lang="ts">
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import Segmented from "../../ui/Segmented.svelte";
  import Toggle from "../../ui/Toggle.svelte";
  import { app } from "../state.svelte";

  const s = $derived(app.progress.settings);
</script>

<ScreenHeader title={t("settings.title")} backTo="#/profile" />

<Card padded={false}>
  <Segmented
    label={t("settings.theme")}
    value={s.theme}
    onchange={(theme) => app.updateSettings({ theme })}
    options={[
      { value: "system", label: t("settings.themeSystem") },
      { value: "light", label: t("settings.themeLight") },
      { value: "dark", label: t("settings.themeDark") },
    ]}
  />
  <Segmented
    label={t("settings.letterSize")}
    value={s.letterSize}
    onchange={(letterSize) => app.updateSettings({ letterSize })}
    options={[
      { value: "normal", label: t("settings.sizeNormal") },
      { value: "large", label: t("settings.sizeLarge") },
    ]}
  />
  <Segmented
    label={t("settings.script")}
    value={s.script}
    onchange={(script) => app.updateSettings({ script })}
    options={[
      { value: "print", label: t("settings.scriptPrint") },
      { value: "handwriting", label: t("settings.scriptHandwriting") },
    ]}
  />
</Card>

<Card padded={false}>
  <Segmented
    label={t("settings.strictness")}
    hint={t("settings.strictnessHint")}
    value={s.strictness}
    onchange={(strictness) => app.updateSettings({ strictness })}
    options={[
      { value: "soft", label: t("settings.strictSoft") },
      { value: "strict", label: t("settings.strictStrict") },
    ]}
  />
  <Toggle
    label={t("settings.autoAdvance")}
    hint={t("settings.autoAdvanceHint")}
    checked={s.autoAdvance}
    onchange={(autoAdvance) => app.updateSettings({ autoAdvance })}
  />
  <Toggle label={t("settings.showIpa")} checked={s.showIpa} onchange={(showIpa) => app.updateSettings({ showIpa })} />
</Card>
