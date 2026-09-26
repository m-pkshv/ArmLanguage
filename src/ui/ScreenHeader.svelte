<script lang="ts">
  import { router } from "../app/router.svelte";
  import { t } from "../i18n";
  import Icon from "./Icon.svelte";

  // backTo — куда вернуться, если экран открыт по ссылке и истории нет.
  let { title, backTo }: { title: string; backTo?: string } = $props();
</script>

<header class="header">
  {#if backTo}
    <button class="back" onclick={() => router.back(backTo)} aria-label={t("common.back")}>
      <Icon name="back" />
    </button>
  {/if}
  <h1>{title}</h1>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 56px;
    margin: 0 -8px 8px;
  }
  h1 {
    margin: 0 8px;
    font-size: 24px;
    line-height: 1.2;
  }
  .back {
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--text);
  }
  .back + h1 {
    margin-left: 0;
  }
</style>
