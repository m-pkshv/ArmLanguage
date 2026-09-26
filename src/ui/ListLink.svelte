<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  let {
    href,
    onclick,
    danger = false,
    disabled = false,
    children,
    hint,
  }: {
    href?: string;
    onclick?: () => void;
    danger?: boolean;
    disabled?: boolean;
    children: Snippet;
    hint?: string;
  } = $props();
</script>

{#if href && !disabled}
  <a class="row" {href}>
    <span class="label">{@render children()}</span>
    {#if hint}<span class="hint">{hint}</span>{/if}
    <Icon name="chevron" size={20} />
  </a>
{:else}
  <button class="row" class:danger {onclick} {disabled}>
    <span class="label">{@render children()}</span>
    {#if hint}<span class="hint">{hint}</span>{/if}
  </button>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 0 16px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    color: var(--text);
    text-align: left;
    text-decoration: none;
  }
  .row:last-child {
    border-bottom: 0;
  }
  .label {
    flex: 1;
  }
  .hint {
    color: var(--muted);
    font-size: 14px;
  }
  .row :global(svg) {
    color: var(--muted);
  }
  .danger {
    color: var(--bad);
  }
  .row:disabled {
    cursor: default;
    color: var(--muted);
  }
</style>
