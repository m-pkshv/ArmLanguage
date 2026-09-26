<script lang="ts">
  import type { Snippet } from "svelte";

  // Белая «карточка» для группы строк или блока контента. padded=false — для списков.
  let { children, padded = true, title }: { children: Snippet; padded?: boolean; title?: string } = $props();
</script>

<section class="group">
  {#if title}<h2>{title}</h2>{/if}
  <div class="card" class:padded>
    {@render children()}
  </div>
</section>

<style>
  .group {
    margin-bottom: 20px;
  }
  h2 {
    margin: 0 4px 8px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .card {
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .padded {
    padding: 16px;
  }
</style>
