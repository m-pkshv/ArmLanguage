<script lang="ts">
  import { content } from "../../core/content";
  import { t } from "../../i18n";
  import Glyph from "../../ui/Glyph.svelte";
  import RuKeyboard from "../../ui/RuKeyboard.svelte";
  import { byId } from "../helpers";
  import type { CheckResult } from "../types";
  import type { TypeSoundQuestion } from "../typeSound";

  // E06: карточка с вводом — набрать звук буквы русскими буквами.
  let { question, result, onanswer }: { question: TypeSoundQuestion; result: CheckResult | null; onanswer: (a: string) => void } = $props();

  let value = $state("");
  const letter = $derived(byId(content, question.letter));
</script>

<div class="prompt">
  <Glyph {letter} form={question.form} handwriting={question.handwriting} size={88} />
  <p class="q">{t("session.qTypeSound")}</p>
</div>

<RuKeyboard keys={question.keys} bind:value disabled={!!result} onsubmit={() => onanswer(value)} ongiveup={() => onanswer("")} />

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 170px;
    text-align: center;
  }
  .q {
    margin: 8px 0 12px;
    color: var(--muted);
    font-size: 15px;
  }
</style>
