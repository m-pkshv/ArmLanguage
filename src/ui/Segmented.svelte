<script lang="ts" generics="T extends string">
  // Переключатель из нескольких вариантов (тема, размер букв…).
  let {
    label,
    options,
    value,
    onchange,
    hint,
  }: {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onchange: (value: T) => void;
    hint?: string;
  } = $props();

  const id = `seg-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="field" role="radiogroup" aria-labelledby={id}>
  <div class="label" {id}>{label}</div>
  <div class="options">
    {#each options as opt (opt.value)}
      <button
        role="radio"
        aria-checked={opt.value === value}
        class:selected={opt.value === value}
        onclick={() => onchange(opt.value)}
      >
        {opt.label}
      </button>
    {/each}
  </div>
  {#if hint}<div class="hint">{hint}</div>{/if}
</div>

<style>
  .field {
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
  }
  .field:last-child {
    border-bottom: 0;
  }
  .label {
    margin-bottom: 8px;
  }
  .options {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: var(--surface-2);
  }
  button {
    flex: 1;
    min-height: 40px;
    padding: 0 8px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--muted);
    font-size: 14px;
    font-weight: 500;
  }
  button.selected {
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
  .hint {
    margin-top: 6px;
    color: var(--muted);
    font-size: 13px;
  }
</style>
