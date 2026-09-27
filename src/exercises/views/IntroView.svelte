<script lang="ts">
  import type { Letter } from "../../core/content/types";
  import { t } from "../../i18n";
  import LetterCard from "../../ui/LetterCard.svelte";

  // E01: знакомство с новой буквой (docs/03-exercises.md). Не оценивается.
  let { letter, showIpa, onnext }: { letter: Letter; showIpa: boolean; onnext: () => void } = $props();

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onnext();
    }
  }
</script>

<svelte:window {onkeydown} />

<p class="label">{t("session.newLetter")}</p>
<LetterCard {letter} {showIpa} compact />
<button class="next" onclick={onnext}>{t("session.gotIt")}</button>

<style>
  .label {
    margin: 0 0 10px;
    color: var(--accent);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-align: center;
    text-transform: uppercase;
  }
  .next {
    position: sticky;
    bottom: calc(12px + env(safe-area-inset-bottom));
    width: 100%;
    min-height: 54px;
    margin-top: 16px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font-size: 17px;
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  /* Главная кнопка: нажата и неактивна — явными цветами, без прозрачности (docs/11-design.md) */
  .next:active:not(:disabled) {
    border-color: var(--accent-pressed);
    background: var(--accent-pressed);
  }
  .next:disabled {
    border-color: transparent;
    background: var(--surface-2);
    color: var(--muted);
    opacity: 1;
  }
</style>
