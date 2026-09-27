import type { Content } from "../../core/content/types";
import type { Skill } from "../../core/progress/types";
import type { Rng } from "../../core/random";
import type { WordExerciseId } from "../../core/session/types";
import { studyItem, type StudyItem } from "../../core/words";
import { t } from "../../i18n";
import type { CheckContext, CheckResult } from "../types";

// Задания раздела «Первые слова» (docs/10-first-words.md, 10.5). Элемент — слово или фраза («word:barev»).
// Навыки: meaning — понимание (армянское → смысл), produce — вспоминание (смысл → армянское).

export interface WordContext {
  content: Content;
  rng: Rng;
  /** Элементы, из которых берутся неправильные варианты: сначала — слова и фразы той же темы. */
  pool: string[];
  /** Показывать чтение русскими буквами (слово ещё новое). */
  reading: boolean;
}

export interface WordExerciseLogic<Q = unknown, A = unknown> {
  id: WordExerciseId;
  skill: Skill;
  kind: StudyItem["kind"];
  isApplicable(item: StudyItem, ctx: WordContext): boolean;
  generate(item: StudyItem, ctx: WordContext): Q;
  check(question: Q, answer: A, ctx: CheckContext): CheckResult;
}

/** W02 / W03 / W08: выбор из вариантов. */
export interface WordChoiceQuestion {
  item: string;
  /** meaning — показано армянское, выбрать смысл; produce — показан смысл, выбрать армянское. */
  mode: "meaning" | "produce";
  options: string[];
  reading: boolean;
}

/** W07: собрать фразу из слов. */
export interface PhraseBuildQuestion {
  item: string;
  /** Слова фразы в правильном порядке (без знаков препинания в конце). */
  tokens: string[];
  /** Карточки со словами: слова фразы и 1–2 лишних, перемешаны. */
  bank: string[];
  reading: boolean;
}

/** Слова фразы: «Լավ եմ, շնորհակալություն։» → ["Լավ", "եմ", "շնորհակալություն"]. */
export const phraseTokens = (hy: string): string[] => hy.split(/\s+/).map((w) => w.replace(/[,։.!?]+$/u, "")).filter(Boolean);

/** Неправильные варианты: элементы того же вида с другим переводом — сначала из пула, потом любые с темой. */
function distractors(item: StudyItem, ctx: WordContext, n: number, key: (x: StudyItem) => string): string[] {
  const c = ctx.content;
  const sameKind = (id: string) => id.startsWith(`${item.kind}:`) && id !== item.id;
  const rest =
    item.kind === "word"
      ? c.words.filter((w) => w.themes?.length).map((w) => `word:${w.id}`)
      : c.phrases.map((p) => `phrase:${p.id}`);
  const out: StudyItem[] = [];
  const keys = new Set([key(item)]);
  for (const id of [...ctx.rng.shuffle(ctx.pool.filter(sameKind)), ...ctx.rng.shuffle(rest.filter(sameKind))]) {
    if (out.length >= n) break;
    const x = studyItem(c, id);
    if (keys.has(key(x))) continue;
    keys.add(key(x));
    out.push(x);
  }
  return out.map((x) => x.id);
}

const itemLine = (x: StudyItem) => t("ex.itemLine", { hy: x.hy, pron: x.pronunciation, ru: x.ru });

function choiceCheck(q: WordChoiceQuestion, answer: string, c: CheckContext, skill: Skill): CheckResult {
  const item = studyItem(c.content, q.item);
  const ok = answer === q.item;
  return {
    verdict: ok ? "correct" : "wrong",
    effects: [{ letter: "", item: q.item, skill, verdict: ok ? "correct" : "wrong" }],
    confusions: [],
    explanation: {
      title: t(ok ? "ex.correct" : "ex.rightAnswer", { what: itemLine(item) }),
      lines: ok || !answer ? [] : [t("ex.youChose", { what: itemLine(studyItem(c.content, answer)) })],
    },
    letter: "",
  };
}

const choice = (id: WordExerciseId, kind: StudyItem["kind"], mode: WordChoiceQuestion["mode"], count: number): WordExerciseLogic<WordChoiceQuestion, string> => ({
  id,
  skill: mode,
  kind,
  isApplicable: (item, ctx) => item.kind === kind && distractors(item, ctx, count - 1, (x) => x.ru).length >= 2,
  generate(item, ctx) {
    // варианты различаются и смыслом, и написанием — иначе правильных было бы два
    const wrong = distractors(item, ctx, count - 1, (x) => (mode === "meaning" ? x.ru : x.hy));
    return { item: item.id, mode, options: ctx.rng.shuffle([item.id, ...wrong]), reading: ctx.reading };
  },
  check: (q, a, c) => choiceCheck(q, a, c, mode),
});

export const wordMeaning = choice("word-meaning", "word", "meaning", 4);
export const wordProduce = choice("word-produce", "word", "produce", 4);
export const phraseMeaning = choice("phrase-meaning", "phrase", "meaning", 3);

export const phraseBuild: WordExerciseLogic<PhraseBuildQuestion, string[]> = {
  id: "phrase-build",
  skill: "produce",
  kind: "phrase",
  isApplicable: (item) => item.kind === "phrase" && phraseTokens(item.hy).length >= 2,
  generate(item, ctx) {
    const tokens = phraseTokens(item.hy);
    // лишние слова — из других фраз, чтобы нельзя было собрать фразу простым перебором
    const extra = ctx.rng
      .shuffle(ctx.content.phrases.flatMap((p) => phraseTokens(p.hy)))
      .filter((w, i, all) => !tokens.includes(w) && all.indexOf(w) === i)
      .slice(0, tokens.length > 3 ? 2 : 1);
    return { item: item.id, tokens, bank: ctx.rng.shuffle([...tokens, ...extra]), reading: ctx.reading };
  },
  check(q, a, c) {
    const item = studyItem(c.content, q.item);
    const ok = a.join(" ") === q.tokens.join(" ");
    return {
      verdict: ok ? "correct" : "wrong",
      effects: [{ letter: "", item: q.item, skill: "produce", verdict: ok ? "correct" : "wrong" }],
      confusions: [],
      explanation: {
        title: t(ok ? "ex.correct" : "ex.rightAnswer", { what: itemLine(item) }),
        lines: ok || !a.length ? [] : [t("ex.youBuilt", { what: a.join(" ") })],
      },
      letter: "",
    };
  },
};

export const WORD_EXERCISES: Record<WordExerciseId, WordExerciseLogic<any, any>> = {
  "word-meaning": wordMeaning,
  "word-produce": wordProduce,
  "phrase-meaning": phraseMeaning,
  "phrase-build": phraseBuild,
};
