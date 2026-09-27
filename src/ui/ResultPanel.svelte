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
    /** Ссылка «Карточка буквы»; в заданиях на слова её нет. */
    oncard?: () => void;
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
      {#if oncard}<button class="link" onclick={oncard}>{t("session.letterCard")}</button>{/if}
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
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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
  /* Цвет статуса — в --st; значок — залитый кружок с ✓ ≈ ✗ цветом --on-status (docs/11-design.md) */
  .correct {
    --st: var(--good);
    background: var(--good-soft);
  }
  .partial {
    --st: var(--warn);
    background: var(--warn-soft);
  }
  .wrong {
    --st: var(--bad);
    background: var(--bad-soft);
  }
  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 8px;
    color: var(--st);
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
  }
  .icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--st);
    color: var(--on-status);
    font-size: 17px;
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
    min-height: 56px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font-size: 17px;
    font-weight: 600;
  }
  .next:active {
    background: var(--accent-pressed);
  }
</style>
