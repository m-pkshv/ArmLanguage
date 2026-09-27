<script lang="ts">
  import { content } from "../../core/content";
  import { soundLabel } from "../../core/checking/answer";
  import type { ExerciseId } from "../../core/session/types";
  import { t } from "../../i18n";
  import Glyph from "../../ui/Glyph.svelte";
  import OptionGrid from "../../ui/OptionGrid.svelte";
  import type { CaseQuestion, HandwritingQuestion, LetterChoiceQuestion } from "../choice";
  import { byId } from "../helpers";
  import type { CheckResult } from "../types";

  // E02 буква → звук, E03 звук → буква, E15 заглавная ↔ строчная, E11 рукописная ↔ печатная.
  let {
    type,
    question,
    result,
    onanswer,
  }: {
    type: ExerciseId;
    question: LetterChoiceQuestion | CaseQuestion | HandwritingQuestion;
    result: CheckResult | null;
    onanswer: (answer: string) => void;
  } = $props();

  let chosen = $state<string | null>(null);
  const letter = $derived(byId(content, question.letter));
  const from = $derived("from" in question && question.from !== "handwriting" && question.from !== "print" ? question.from : "upper");
  // E11: что показано в вопросе — рукописная или печатная буква
  const hw = $derived(type === "handwriting-match" ? (question as HandwritingQuestion) : null);
</script>

<div class="prompt">
  {#if type === "letter-to-sound"}
    <Glyph {letter} form={question.form} handwriting={question.handwriting} size={88} />
    <p class="q">{t("session.qLetterToSound")}</p>
  {:else if type === "sound-to-letter"}
    <div class="sound">{soundLabel(letter)}</div>
    {#if letter.sound.ru !== letter.sound.canonical}<p class="desc">{letter.sound.ru}</p>{/if}
    <p class="q">{t("session.qSoundToLetter")}</p>
  {:else if hw}
    <Glyph {letter} form={hw.form} handwriting={hw.from === "handwriting"} size={88} />
    <p class="q">{hw.from === "handwriting" ? t("session.qFindPrint") : t("session.qFindHandwritten")}</p>
    {#if result}
      <!-- После ответа — обе формы рядом, чтобы запомнить соответствие -->
      <div class="both">
        <Glyph {letter} form="pair" size={40} />
        <Glyph {letter} form="pair" handwriting size={40} />
      </div>
    {/if}
  {:else}
    <Glyph {letter} form={from} handwriting={question.handwriting} size={88} />
    <p class="q">{from === "upper" ? t("session.qFindLower") : t("session.qFindUpper")}</p>
  {/if}
</div>

<OptionGrid
  options={question.options}
  correct={(id) => id === question.letter}
  chosen={result ? chosen : null}
  big={type !== "letter-to-sound"}
  onpick={(id) => {
    chosen = id;
    onanswer(id);
  }}
>
  {#snippet item(id)}
    {@const o = byId(content, id)}
    {#if type === "letter-to-sound"}
      {soundLabel(o)}
    {:else if type === "sound-to-letter"}
      <Glyph letter={o} form="pair" handwriting={question.handwriting} size={32} />
    {:else if hw}
      <Glyph letter={o} form={hw.form} handwriting={hw.from === "print"} size={hw.from === "print" ? 50 : 36} />
    {:else}
      <Glyph letter={o} form={from === "upper" ? "lower" : "upper"} handwriting={question.handwriting} size={36} />
    {/if}
  {/snippet}
</OptionGrid>

<style>
  .prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    margin-bottom: 16px;
    text-align: center;
  }
  .sound {
    color: var(--accent);
    font-size: 52px;
    font-weight: 600;
    line-height: 1.2;
  }
  .desc {
    margin: 4px 0 0;
    color: var(--muted);
  }
  .both {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 8px;
  }
  .q {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 15px;
  }
</style>
