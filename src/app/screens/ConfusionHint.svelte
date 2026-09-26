<script lang="ts">
  import { content, letterById } from "../../core/content";
  import { knownLetters } from "../../core/course";
  import { availableGroups, frequentConfusions, pairGroups } from "../../core/pairs";
  import { t } from "../../i18n";
  import { startPairs } from "../../session/start";
  import { app } from "../state.svelte";

  // «Вы путаете Տ и Թ — потренируемся?» — когда пару спутали хотя бы 2 раза (docs/02-features.md, 2.8).
  // only — показывать только пары с этими буквами (итоги занятия).
  let { only }: { only?: string[] } = $props();

  const top = $derived.by(() => {
    const groups = availableGroups(pairGroups(content), knownLetters(app.progress, content));
    const list = frequentConfusions(app.progress, groups).filter((f) => !only || f.group.letters.some((id) => only.includes(id)));
    return list[0]?.group;
  });
  const names = $derived(top ? top.letters.map((id) => letterById(id)!.upper) : []);
</script>

{#if top}
  <button class="hint" onclick={() => startPairs([top])}>
    <span>{t("pairs.hint", { a: names.slice(0, -1).join(", "), b: names[names.length - 1]! })}</span>
    <span class="go">{t("pairs.hintGo")}</span>
  </button>
{/if}

<style>
  .hint {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: var(--accent-soft);
    color: var(--text);
    font: inherit;
    font-size: 15px;
    text-align: left;
  }
  .go {
    flex: none;
    color: var(--accent);
    font-weight: 600;
  }
</style>
