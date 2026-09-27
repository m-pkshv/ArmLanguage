import type { Content } from "../../core/content/types";
import type { Skill } from "../../core/progress/types";
import type { Rng } from "../../core/random";
import type { WordExerciseId } from "../../core/session/types";
import { tokensOf } from "../../core/text/armenian";
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
  /** «Найди пары»: из каких элементов собирать поле. */
  group?: string[];
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
    // одинаковый текст или то же значение (մամա / մայր) — тогда правильных ответов было бы два
    if (keys.has(key(x)) || item.same.includes(x.id) || x.same.includes(item.id)) continue;
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

/** W05 / W06: написать слово по буквам — из перемешанных карточек или на армянской клавиатуре. */
export interface WordSpellQuestion {
  item: string;
  /** Буквы слова в нижнем регистре: «ձուկ» → ["ձ", "ու", "կ"]. */
  letters: string[];
  /** Карточки (для «собери слово»): буквы слова и 1–2 похожие, перемешаны. Для клавиатуры — пусто. */
  tiles: string[];
  reading: boolean;
}

/** Буквы слова в нижнем регистре (ու — одна буква). */
export const wordLetters = (hy: string): string[] => tokensOf(hy.toLocaleLowerCase("hy")).filter((x) => x.trim());

/** Где ошибка: первая буква, которая не совпала, — для объяснения «на 2-м месте нужна ձ». */
function spellMistake(expected: string[], given: string[]): string | null {
  if (!given.length) return null;
  const i = expected.findIndex((l, k) => given[k] !== l);
  if (i < 0) return given.length > expected.length ? t("ex.spellExtra") : null;
  if (i >= given.length) return t("ex.spellShort", { n: expected.length - given.length });
  return t("ex.spellAt", { n: i + 1, expected: expected[i]!, given: given[i]! });
}

function spellCheck(q: WordSpellQuestion, a: string[], c: CheckContext): CheckResult {
  const item = studyItem(c.content, q.item);
  const ok = a.join("") === q.letters.join("");
  const mistake = ok ? null : spellMistake(q.letters, a);
  return {
    verdict: ok ? "correct" : "wrong",
    effects: [{ letter: "", item: q.item, skill: "spell", verdict: ok ? "correct" : "wrong" }],
    confusions: [],
    explanation: {
      title: t(ok ? "ex.correct" : "ex.rightAnswer", { what: itemLine(item) }),
      lines: [...(a.length && !ok ? [t("ex.youWrote", { what: a.join("") })] : []), ...(mistake ? [mistake] : [])],
    },
    letter: "",
  };
}

const spellable = (item: StudyItem) => item.kind === "word" && wordLetters(item.hy).length >= 2;

export const wordBuild: WordExerciseLogic<WordSpellQuestion, string[]> = {
  id: "word-build",
  skill: "spell",
  kind: "word",
  isApplicable: spellable,
  generate(item, ctx) {
    const letters = wordLetters(item.hy);
    // лишние карточки — буквы, похожие на буквы слова по звуку или виду (Տ/Թ, ո/ս)
    const lowerOf = (id: string) => ctx.content.letters.find((l) => l.id === id)!.lower;
    const partners = ctx.content.letters
      .filter((l) => letters.includes(l.lower))
      .flatMap((l) => [...l.confusable.sound, ...l.confusable.shape].map(lowerOf))
      .filter((x) => !letters.includes(x));
    // если похожих нет (լավ) — любые другие буквы
    const others = ctx.rng.shuffle(ctx.content.letters.map((l) => l.lower).filter((x) => !letters.includes(x) && !partners.includes(x)));
    const extra = [...ctx.rng.shuffle([...new Set(partners)]), ...others].slice(0, letters.length > 4 ? 2 : 1);
    return { item: item.id, letters, tiles: ctx.rng.shuffle([...letters, ...extra]), reading: ctx.reading };
  },
  check: spellCheck,
};

export const wordWrite: WordExerciseLogic<WordSpellQuestion, string[]> = {
  id: "word-write",
  skill: "spell",
  kind: "word",
  isApplicable: spellable,
  generate: (item, ctx) => ({ item: item.id, letters: wordLetters(item.hy), tiles: [], reading: ctx.reading }),
  check: spellCheck,
};

/** W04: найди пары — армянские слова ↔ картинки с переводом (как E05 для букв). */
export interface WordMatchQuestion {
  left: string[];
  right: string[];
}

export interface WordMatchAnswer {
  ms: number;
  /** Ошибочные пары: [слово слева, слово справа]. */
  mistakes: [string, string][];
}

const MATCH_SIZE = 5;

function matchItems(item: StudyItem, ctx: WordContext): StudyItem[] {
  const out = [item];
  const ids = [...ctx.rng.shuffle((ctx.group ?? ctx.pool).filter((id) => id !== item.id && id.startsWith("word:")))];
  for (const id of ids) {
    if (out.length >= MATCH_SIZE) break;
    const x = studyItem(ctx.content, id);
    // разные переводы и не синонимы — иначе пары неоднозначны
    if (out.some((o) => o.ru === x.ru || o.same.includes(x.id) || x.same.includes(o.id))) continue;
    out.push(x);
  }
  return out;
}

export const wordMatch: WordExerciseLogic<WordMatchQuestion, WordMatchAnswer> = {
  id: "word-match",
  skill: "meaning",
  kind: "word",
  isApplicable: (item, ctx) => item.kind === "word" && matchItems(item, ctx).length >= 3,
  generate(item, ctx) {
    const ids = matchItems(item, ctx).map((x) => x.id);
    const left = ctx.rng.shuffle(ids);
    // ни одна пара не стоит напротив друг друга
    let right = ctx.rng.shuffle(ids);
    for (let i = 0; i < 50 && right.some((id, k) => id === left[k]); i++) right = ctx.rng.shuffle(ids);
    return { left, right };
  },
  check(q, a, c) {
    const missed = new Set(a.mistakes.map(([l]) => l));
    const secs = Math.round(a.ms / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    return {
      verdict: a.mistakes.length ? "partial" : "correct",
      effects: q.left.map((id) => ({ letter: "", item: id, skill: "meaning" as const, verdict: missed.has(id) ? ("wrong" as const) : ("correct" as const) })),
      confusions: [],
      explanation: {
        title: a.mistakes.length ? t("ex.matchErrors", { time, n: a.mistakes.length }) : t("ex.matchDone", { time }),
        lines: [...missed].map((id) => t("ex.matchRemember", { what: itemLine(studyItem(c.content, id)) })),
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
  "word-build": wordBuild,
  "word-write": wordWrite,
  "word-match": wordMatch,
};
