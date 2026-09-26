<script lang="ts">
  import { LETTERS } from "../../core/content";
  import { t } from "../../i18n";
  import LetterGlyph from "../../ui/LetterGlyph.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import Segmented from "../../ui/Segmented.svelte";
  import { hrefOf } from "../routes";
  import { app } from "../state.svelte";

  const script = $derived(app.progress.settings.script);
  const scale = $derived(app.progress.settings.letterSize === "large" ? 1.3 : 1);
</script>

<ScreenHeader title={t("alphabet.title")} />

<div class="toolbar">
  <Segmented
    label={t("settings.script")}
    compact
    value={script}
    onchange={(v) => app.updateSettings({ script: v })}
    options={[
      { value: "print", label: t("settings.scriptPrint") },
      { value: "handwriting", label: t("settings.scriptHandwriting") },
    ]}
  />
</div>

<div class="grid">
  {#each LETTERS as letter (letter.id)}
    <a class="cell" href={hrefOf({ name: "letter", id: letter.id })}>
      <span class="glyph"><LetterGlyph {letter} {script} size={24 * scale} /></span>
      <span class="tr">{letter.sound.canonical}</span>
      <span class="nm">{letter.name.ru}</span>
    </a>
  {/each}
</div>

<style>
  .toolbar {
    margin-bottom: 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 8px;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    text-decoration: none;
  }
  .glyph {
    display: flex;
    align-items: center;
    min-height: calc(56px * var(--glyph-scale));
  }
  .tr {
    font-weight: 600;
    line-height: 1.3;
  }
  .nm {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.3;
  }
</style>
