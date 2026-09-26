<script lang="ts">
  import type { Verdict } from "../core/progress/srs";
  import type { Explanation } from "../exercises/types";
  import { t } from "../i18n";

  // Панель результата выезжает снизу после ответа (docs/09-navigation.md, 9.7).
  // Верно — зелёная, почти — жёлтая, неверно — красная; кнопка «Дальше» / «Понятно».
  let {
    verdict,
    explanation,
    onnext,
    oncard,
    reportHref,
  }: {
    verdict: Verdict;
    explanation: Explanation;
    onnext: () => void;
    oncard: () => void;
    reportHref: string | null;
  } = $props();

  let button = $state<HTMLButtonElement>();
  $effect(() => button?.focus());

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onnext();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="panel {verdict}" role="status">
  <div class="inner">
    <p class="title">
      <span class="icon" aria-hidden="true">{verdict === "correct" ? "✓" : verdict === "partial" ? "≈" : "✗"}</span>
      <span>{explanation.title}</span>
    </p>
    {#each explanation.lines as line (line)}<p class="line">{line}</p>{/each}
    <div class="links">
      <button class="link" onclick={oncard}>{t("session.letterCard")}</button>
      {#if reportHref}<a class="link" href={reportHref} target="_blank" rel="noopener">{t("session.report")}</a>{/if}
    </div>
    <button bind:this={button} class="next" onclick={onnext}>
      {verdict === "wrong" ? t("session.understood") : t("session.next")}
    </button>
  </div>
</div>

<style>
  .panel {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 15;
    padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
    border-top: 3px solid;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
    animation: up 0.2s ease-out;
  }
  .inner {
    max-width: 608px;
    margin: 0 auto;
  }
  @keyframes up {
    from {
      transform: translateY(100%);
    }
  }
  .correct {
    border-color: var(--good);
    background: var(--good-soft);
  }
  .partial {
    border-color: var(--warn);
    background: var(--warn-soft);
  }
  .wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .title {
    display: flex;
    gap: 8px;
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
  }
  .correct .icon {
    color: var(--good);
  }
  .partial .icon {
    color: var(--warn);
  }
  .wrong .icon {
    color: var(--bad);
  }
  .line {
    margin: 0 0 4px;
    font-size: 15px;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 6px 0 12px;
  }
  .link {
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--text);
    font-size: 14px;
    text-decoration: underline;
    opacity: 0.8;
  }
  .next {
    width: 100%;
    min-height: 54px;
    border: 0;
    border-radius: var(--radius);
    background: var(--text);
    color: var(--bg);
    font-size: 17px;
    font-weight: 600;
  }
  .correct .next {
    background: var(--good);
    color: var(--bg);
  }
</style>
