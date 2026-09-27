<script lang="ts" module>
  // Событие установки приходит один раз и рано — ловим его при загрузке модуля.
  interface InstallPrompt extends Event {
    prompt(): Promise<void>;
  }
  let deferred: InstallPrompt | null = null;
  if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferred = e as InstallPrompt;
    });
  }
</script>

<script lang="ts">
  import { t } from "../../i18n";

  // Подсказка «Установите на главный экран» — после 2-го урока (docs/09-navigation.md, 9.13).
  // На iPhone установленное приложение защищает прогресс от автоматической очистки Safari.
  let { show }: { show: boolean } = $props();

  const KEY = "hy:install-hint-dismissed";
  const readDismissed = () => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  };
  let dismissed = $state(readDismissed());
  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  const ios = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
  let canPrompt = $state(!!deferred);

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    deferred = null;
    canPrompt = false;
    dismiss();
  }
</script>

{#if show && !dismissed && !standalone && (canPrompt || ios)}
  <div class="hint">
    <p><b>{t("install.title")}</b> {t("install.why")}</p>
    {#if canPrompt}
      <button class="btn" onclick={install}>{t("install.button")}</button>
    {:else}
      <p class="small">{t("install.ios")}</p>
    {/if}
    <button class="close" onclick={dismiss}>{t("install.dismiss")}</button>
  </div>
{/if}

<style>
  .hint {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--accent-soft);
    font-size: 14px;
  }
  p {
    margin: 0 0 8px;
  }
  .small {
    font-size: 13px;
  }
  .btn {
    min-height: 44px;
    margin-right: 12px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
  }
  .close {
    padding: 8px 0;
    border: 0;
    background: none;
    color: var(--muted);
    text-decoration: underline;
  }
  /* Главная кнопка: нажата и неактивна — явными цветами, без прозрачности (docs/11-design.md) */
  .btn:active:not(:disabled) {
    border-color: var(--accent-pressed);
    background: var(--accent-pressed);
  }
  .btn:disabled {
    border-color: transparent;
    background: var(--surface-2);
    color: var(--muted);
    opacity: 1;
  }
</style>
