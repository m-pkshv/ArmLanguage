<script lang="ts">
  import { content, letterById } from "../../core/content";
  import { alphabetLessons, knownLetters, lessonLetters } from "../../core/course";
  import { boxOf, isLearned } from "../../core/progress/knowledge";
  import type { ExerciseId } from "../../core/session/types";
  import { t } from "../../i18n";
  import Card from "../../ui/Card.svelte";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import Segmented from "../../ui/Segmented.svelte";
  import { startPractice } from "../../session/start";
  import { app } from "../state.svelte";

  // Своя тренировка: какие буквы, какие задания, шрифт и длина (docs/02-features.md, 2.8).
  // Последний выбор запоминается в браузере — это удобство, а не прогресс.
  const KEY = "hy:custom-practice";
  type Group = string; // "lesson-N" | "confusable" | "weak" | "all"
  interface Saved {
    group: Group;
    types: ExerciseId[];
    script: "print" | "handwriting" | "mixed";
    length: number;
  }
  const TYPES: ExerciseId[] = ["letter-to-sound", "sound-to-letter", "picture-to-letter", "case-match", "confusable-pair", "letter-type-sound", "ru-word-insert"];
  const defaults: Saved = { group: "all", types: [...TYPES], script: "print", length: 20 };
  const load = (): Saved => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
    } catch {
      return defaults;
    }
  };
  let cfg = $state<Saved>(load());

  const lessons = alphabetLessons(content);
  const known = $derived(knownLetters(app.progress, content));
  const groups = $derived([
    { id: "all", label: t("custom.all") },
    { id: "weak", label: t("custom.weak") },
    { id: "confusable", label: t("custom.confusable") },
    ...lessons.map((l, i) => ({ id: `lesson-${i}`, label: t("lessons.lesson", { n: i + 1 }) })).filter((_, i) => lessonLetters(lessons[i]!).some((id) => known.includes(id))),
  ]);

  const letters = $derived.by(() => {
    const g = cfg.group;
    if (g.startsWith("lesson-")) return lessonLetters(lessons[Number(g.slice(7))]!).filter((id) => known.includes(id));
    if (g === "weak") {
      const weak = known.filter((id) => !isLearned(app.progress, id));
      return weak.length >= 2 ? weak : [...known].sort((a, b) => boxOf(app.progress, a, "recall") - boxOf(app.progress, b, "recall")).slice(0, 8);
    }
    if (g === "confusable") return known.filter((id) => letterById(id)!.confusable.sound.some((p) => known.includes(p)));
    return known;
  });

  function toggle(type: ExerciseId) {
    cfg.types = cfg.types.includes(type) ? cfg.types.filter((x) => x !== type) : [...cfg.types, type];
  }

  function start() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch {
      /* ignore */
    }
    startPractice(letters, cfg.types, cfg.length || 60, cfg.script);
  }
</script>

<ScreenHeader title={t("custom.title")} backTo="#/practice" />

<Card title={t("custom.letters")}>
  <div class="chips">
    {#each groups as g (g.id)}
      <button class="chip" class:on={cfg.group === g.id} onclick={() => (cfg.group = g.id)}>{g.label}</button>
    {/each}
  </div>
  <p class="preview hy" lang="hy">{letters.map((id) => letterById(id)!.upper).join(" ") || "—"}</p>
</Card>

<Card title={t("custom.types")} padded={false}>
  {#each TYPES as type (type)}
    <label class="check">
      <input type="checkbox" checked={cfg.types.includes(type)} onchange={() => toggle(type)} />
      <span>{t(`custom.type.${type}`)}</span>
    </label>
  {/each}
</Card>

<Card padded={false}>
  <Segmented
    label={t("settings.script")}
    value={cfg.script}
    onchange={(v) => (cfg.script = v)}
    options={[
      { value: "print", label: t("settings.scriptPrint") },
      { value: "handwriting", label: t("settings.scriptHandwriting") },
      { value: "mixed", label: t("custom.mixed") },
    ]}
  />
  <Segmented
    label={t("custom.length")}
    value={String(cfg.length)}
    onchange={(v) => (cfg.length = Number(v))}
    options={[
      { value: "10", label: "10" },
      { value: "20", label: "20" },
      { value: "0", label: t("custom.endless") },
    ]}
  />
</Card>

<button class="start" disabled={letters.length < 2 || !cfg.types.length} onclick={start}>{t("custom.start")}</button>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    font-size: 14px;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
  .preview {
    margin: 12px 0 0;
    font-size: 20px;
    letter-spacing: 0.06em;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid var(--line);
  }
  .check:last-child {
    border-bottom: 0;
  }
  .check input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }
  .start {
    width: 100%;
    min-height: 56px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-text);
    font-size: 17px;
    font-weight: 600;
  }
  .start:disabled {
    opacity: 0.5;
  }
</style>
