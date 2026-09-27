<script lang="ts">
  import { backupFileName, parseBackup, serializeBackup } from "../../core/progress/backup";
  import { ProgressFormatError } from "../../core/progress/schema";
  import { t } from "../../i18n";
  import { downloadTextFile } from "../../platform/storage";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { toast } from "../../ui/Toast.svelte";
  import { app } from "../state.svelte";

  let fileInput: HTMLInputElement;

  const lastSaved = $derived(app.progress.meta.lastBackupAt);
  const lastSavedText = $derived(
    lastSaved
      ? t("backup.lastSaved", { date: new Date(lastSaved).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) })
      : t("backup.neverSaved"),
  );

  function save() {
    const now = new Date();
    app.markBackupSaved();
    downloadTextFile(backupFileName(now), serializeBackup($state.snapshot(app.progress), now));
    toast.show(t("backup.saved"));
  }

  async function load(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ""; // чтобы можно было выбрать тот же файл ещё раз
    if (!file) return;
    try {
      const data = parseBackup(await file.text(), new Date());
      if (!confirm(t("backup.loadConfirm"))) return;
      app.replaceProgress(data);
      toast.show(t("backup.loaded"));
    } catch (err) {
      const reason = err instanceof ProgressFormatError ? err.reason : "broken";
      const key = { "not-progress": "errNotProgress", "too-new": "errTooNew", broken: "errBroken" }[reason];
      toast.show(t(`backup.${key}`), "error");
    }
  }
</script>

<ScreenHeader title={t("backup.title")} backTo="#/profile" />

<Card>
  <p>{t("backup.intro")}</p>
  <p class="muted small">{lastSavedText}</p>
  <div class="actions">
    <button class="btn primary" onclick={save}>{t("backup.save")}</button>
    <button class="btn" onclick={() => fileInput.click()}>{t("backup.load")}</button>
  </div>
  <input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={load} />
</Card>

<style>
  p {
    margin: 0 0 12px;
  }
  .small {
    font-size: 14px;
  }
  .actions {
    display: grid;
    gap: 10px;
    margin-top: 8px;
  }
  .btn {
    min-height: 52px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-weight: 600;
  }
  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-text);
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
