<script lang="ts">
  import { t } from "../../i18n";
  import type { Release } from "../whatsNew";

  // Окно «Что нового» (docs/09-navigation.md, 9.16): после обновления и из «О проекте».
  let { release, onclose }: { release: Release; onclose: () => void } = $props();

  let dialog = $state<HTMLDialogElement>();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  // Закрытие кнопкой или клавишей Esc; сообщаем сразу, не дожидаясь события close.
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (dialog?.open) dialog.close();
    onclose();
  }
</script>

<dialog bind:this={dialog} class="dialog" onclose={close} aria-labelledby="whats-new-title">
  <p class="dtitle" id="whats-new-title">{t("whatsNew.title", { v: release.version })}</p>
  <ul>
    {#each release.items as item (item)}
      <li>{t(`whatsNew.${release.key}.${item}`)}</li>
    {/each}
  </ul>
  <button class="btn" onclick={close}>{t("whatsNew.ok")}</button>
</dialog>

<style>
  .dialog {
    width: min(420px, calc(100vw - 32px));
    padding: 20px;
    border: 0;
    border-radius: 20px;
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .dialog::backdrop {
    background: rgba(0, 0, 0, 0.45);
  }
  .dtitle {
    margin: 0 0 12px;
    font-size: 19px;
    font-weight: 600;
  }
  ul {
    display: grid;
    gap: 10px;
    margin: 0 0 20px;
    padding: 0;
    list-style: none;
  }
  .btn {
    width: 100%;
    min-height: 52px;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font: inherit;
    font-weight: 600;
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
