<script lang="ts" module>
  // Короткое сообщение внизу экрана: toast.show("Файл сохранён")
  class ToastState {
    message = $state<string | null>(null);
    kind = $state<"info" | "error">("info");
    private timer: ReturnType<typeof setTimeout> | undefined;

    show(message: string, kind: "info" | "error" = "info") {
      this.message = message;
      this.kind = kind;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => (this.message = null), kind === "error" ? 6000 : 3000);
    }
  }
  export const toast = new ToastState();
</script>

{#if toast.message}
  <div class="toast" class:error={toast.kind === "error"} role="status">{toast.message}</div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 16px);
    z-index: 20;
    width: max-content;
    max-width: calc(100vw - 32px);
    padding: 12px 18px;
    border-radius: 14px;
    background: var(--text);
    color: var(--bg);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    transform: translateX(-50%);
    font-size: 15px;
  }
  .error {
    background: var(--bad);
    color: #fff;
  }
  @media (min-width: 1024px) {
    .toast {
      bottom: 24px;
    }
  }
</style>
