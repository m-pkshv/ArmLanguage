<script lang="ts">
  import { keyToRussian } from "../core/checking/answer";
  import { t } from "../i18n";

  // Экранная русская клавиатура (docs/05-ui-mobile.md, 5.7). Системная клавиатура не открывается.
  // keys = null — полная раскладка ЙЦУКЕН; иначе упрощённая из переданных букв.
  let {
    keys,
    value = $bindable(""),
    onsubmit,
    ongiveup,
    disabled = false,
    maxLength = 6,
  }: {
    keys: string[] | null;
    value?: string;
    onsubmit: () => void;
    ongiveup: () => void;
    disabled?: boolean;
    maxLength?: number;
  } = $props();

  const FULL = ["йцукенгшщзхъ", "фывапролджэ", "ячсмитьбю"].map((r) => r.split(""));
  const rows = $derived(keys ? [keys.slice(0, Math.ceil(keys.length / 2)), keys.slice(Math.ceil(keys.length / 2))] : FULL);

  function press(ch: string) {
    if (!disabled && value.length < maxLength) value += ch;
  }
  function erase() {
    if (!disabled) value = value.slice(0, -1);
  }

  // Физическая клавиатура: русские буквы, латинские по месту в раскладке, Backspace, Enter.
  function onkeydown(e: KeyboardEvent) {
    if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      erase();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (value) onsubmit();
    } else if (e.key.length === 1) {
      const ch = keyToRussian(e.key);
      if (ch) {
        e.preventDefault();
        press(ch === "ё" ? "е" : ch);
      }
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="answer" aria-live="polite">
  <span class="value">{value}</span><span class="caret" class:hidden={disabled}></span>
</div>

<div class="actions">
  <button class="btn" onclick={ongiveup} {disabled}>{t("session.dontKnow")}</button>
  <button class="btn primary" onclick={onsubmit} disabled={disabled || !value}>{t("session.check")}</button>
</div>

<div class="kb" class:simple={!!keys} role="group" aria-label={t("session.keyboard")}>
  {#each rows as row, r (r)}
    <div class="row">
      {#each row as ch (ch)}
        <button class="key" onclick={() => press(ch)} {disabled}>{ch}</button>
      {/each}
      {#if r === rows.length - 1}
        <button class="key erase" onclick={erase} {disabled} aria-label={t("session.erase")}>⌫</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .answer {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
    margin: 0 auto 12px;
    max-width: 260px;
    border-bottom: 3px solid var(--accent);
    font-size: 34px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .caret {
    width: 2px;
    height: 34px;
    margin-left: 2px;
    background: var(--accent);
    animation: blink 1s steps(1) infinite;
  }
  .hidden {
    visibility: hidden;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .btn {
    min-height: 52px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-weight: 600;
  }
  .btn.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-text);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .kb {
    position: sticky;
    bottom: 0;
    display: grid;
    gap: 6px;
    padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
    margin: 0 -12px;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--surface-2);
  }
  .row {
    display: flex;
    justify-content: center;
    gap: 4px;
  }
  .key {
    flex: 1 1 0;
    max-width: 44px;
    min-width: 0;
    height: 48px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: var(--surface);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
    font-size: 20px;
  }
  .simple .key {
    max-width: 60px;
    height: 56px;
    font-size: 24px;
  }
  .key:active {
    background: var(--accent-soft);
  }
  .erase {
    flex-grow: 1.4;
    max-width: 64px;
    font-size: 18px;
  }
  @media (min-width: 600px) {
    .kb {
      margin: 0;
      border-radius: var(--radius-lg);
    }
  }
</style>
