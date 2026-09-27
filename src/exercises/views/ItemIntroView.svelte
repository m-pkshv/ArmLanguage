<script lang="ts">
  import { assetUrl } from "../../core/content";
  import type { StudyItem } from "../../core/words";
  import { t } from "../../i18n";

  // W01: знакомство со словом или фразой — картинка, армянский текст, чтение, перевод (docs/10-first-words.md, 10.5).
  let { item, onnext }: { item: StudyItem; onnext: () => void } = $props();
</script>

<div class="intro">
  <p class="badge">{item.kind === "word" ? t("session.newWord") : t("session.newPhrase")}</p>
  {#if item.image}<img class="word-pic" src={assetUrl(item.image.file)} alt="" width="120" height="120" />{/if}
  <div class="hy" class:phrase={item.kind === "phrase"} lang="hy">{item.hy}</div>
  <div class="pron">[{item.pronunciation}]</div>
  <div class="ru">{item.ru}</div>
</div>
<button class="next" onclick={onnext}>{t("session.understood")}</button>

<style>
  .intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 0 24px;
    text-align: center;
  }
  .badge {
    margin: 0 0 8px;
    color: var(--accent);
    font-size: 14px;
    font-weight: 600;
  }
  .hy {
    margin-top: 8px;
    font-size: calc(40px * var(--glyph-scale));
    line-height: 1.2;
  }
  .hy.phrase {
    font-size: calc(28px * var(--glyph-scale));
  }
  .pron {
    color: var(--muted);
    font-size: 18px;
  }
  .ru {
    font-size: 22px;
    font-weight: 600;
  }
  .next {
    width: 100%;
    min-height: var(--tap);
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font: inherit;
    font-size: 17px;
    font-weight: 600;
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
