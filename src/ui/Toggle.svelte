<script lang="ts">
  let {
    label,
    checked,
    onchange,
    hint,
  }: { label: string; checked: boolean; onchange: (checked: boolean) => void; hint?: string } = $props();
</script>

<label class="field">
  <span class="text">
    <span>{label}</span>
    {#if hint}<span class="hint">{hint}</span>{/if}
  </span>
  <input type="checkbox" role="switch" {checked} onchange={(e) => onchange(e.currentTarget.checked)} />
</label>

<style>
  .field {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 56px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
    cursor: pointer;
  }
  .field:last-child {
    border-bottom: 0;
  }
  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .hint {
    color: var(--muted);
    font-size: 13px;
  }
  input {
    appearance: none;
    flex: none;
    position: relative;
    width: 48px;
    height: 28px;
    margin: 0;
    border-radius: 999px;
    background: var(--line);
    transition: background 0.2s;
    cursor: pointer;
  }
  input::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--plate);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s;
  }
  input:checked {
    background: var(--good);
  }
  input:checked::after {
    transform: translateX(20px);
  }
</style>
