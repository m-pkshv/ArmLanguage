import { normalize } from "../core/checking/answer";
import { mixableLetters, mixedLetters, mixText, type MixedSegment } from "../core/text/mixed";
import type { Effect } from "../core/progress/knowledge";
import { t } from "../i18n";
import { byId, describe } from "./helpers";
import type { ExerciseContext, ExerciseLogic } from "./types";

// E09: смешанное чтение (docs/03-exercises.md). Русский текст с изученными армянскими буквами →
// выбрать правильное прочтение (фразы, тексты) или набрать его (отдельные слова на высоком уровне).
// Нажатие на армянскую букву показывает подсказку — тогда верный ответ засчитывается как «почти».

export interface MixedQuestion {
  letter: string;
  source: "word" | "phrase" | "text";
  /** Исходный русский текст — правильный ответ. */
  answer: string;
  segments: MixedSegment[];
  mode: "choice" | "type";
  /** Варианты прочтения (в режиме выбора) и какую армянскую букву «неправильно прочитали» в каждом. */
  options: string[] | null;
  misread: (string | null)[];
}

export interface MixedAnswer {
  value: string;
  hinted: boolean;
}

interface Source {
  kind: MixedQuestion["source"];
  ru: string;
}

function sources(ctx: ExerciseContext): Source[] {
  const words = ctx.content.ruWords.map((w) => ({ kind: "word" as const, ru: w.ru }));
  const phrases = ctx.content.ruPhrases.map((p) => ({ kind: p.kind, ru: p.ru }));
  return [...words, ...phrases];
}

/** Какие тексты подходят: в тексте есть эта буква, и знакомых армянских букв достаточно, чтобы было что читать. */
function candidates(letterId: string, ctx: ExerciseContext): { src: Source; segments: MixedSegment[] }[] {
  const known = new Set([...ctx.known, ...ctx.focus]);
  // сложность растёт с числом знакомых букв: сначала слова, потом фразы, потом мини-тексты
  const allowed: Source["kind"][] = known.size < 25 ? ["word", "phrase"] : ["phrase", "text", "word"];
  return sources(ctx)
    .filter((s) => allowed.includes(s.kind))
    .map((src) => ({ src, segments: mixText(src.ru, known, ctx.content) }))
    .filter(({ segments }) => segments.some((s) => s.letter === letterId));
}

/** Неправильное прочтение: одна армянская буква прочитана как похожая на неё. */
function misreadings(segments: MixedSegment[], ctx: ExerciseContext, answer: string): { text: string; letter: string }[] {
  const out: { text: string; letter: string }[] = [];
  const ruOf = (id: string) => Object.entries(ctx.content.ruHy).find(([, ids]) => ids.includes(id))?.[0];
  const positions = ctx.rng.shuffle(segments.map((s, i) => i).filter((i) => segments[i]!.letter));
  for (const i of positions) {
    const seg = segments[i]!;
    const l = byId(ctx.content, seg.letter!);
    const partners = ctx.rng.shuffle([...l.confusable.sound, ...l.confusable.shape, ...ctx.known]);
    for (const pid of partners) {
      const ru = ruOf(pid);
      if (!ru || ru === seg.ru.toLowerCase()) continue;
      const replaced = seg.ru[0] !== seg.ru[0]!.toLowerCase() ? ru[0]!.toUpperCase() + ru.slice(1) : ru;
      const text = segments.map((s, j) => (j === i ? replaced : s.ru)).join("");
      if (normalize(text) !== normalize(answer) && !out.some((o) => o.text === text)) {
        out.push({ text, letter: seg.letter! });
        break;
      }
    }
    if (out.length >= 2) break;
  }
  return out;
}

export const mixedReading: ExerciseLogic<MixedQuestion, MixedAnswer> = {
  id: "mixed-reading",
  skills: ["read"],
  isApplicable: (letter, ctx) => mixableLetters(ctx.content).has(letter.id) && candidates(letter.id, ctx).length > 0,
  generate(letter, ctx) {
    const all = candidates(letter.id, ctx);
    // предпочитаем тексты, где армянских букв побольше — интереснее читать
    const scored = all.map((x) => ({ ...x, n: x.segments.filter((s) => s.letter).length })).sort((a, b) => b.n - a.n);
    const pool = ctx.rng.shuffle(scored.slice(0, Math.max(5, Math.ceil(scored.length / 2))));
    // Для выбора нужны два правдоподобных неправильных прочтения; если их нет — берём другой текст,
    // а отдельное слово можно просто набрать на клавиатуре.
    for (const { src, segments } of [...pool, ...ctx.rng.shuffle(scored)]) {
      const answer = src.ru;
      const wrong = misreadings(segments, ctx, answer);
      if (src.kind === "word" && (ctx.level >= 2 || wrong.length < 2)) {
        return { letter: letter.id, source: src.kind, answer, segments, mode: "type", options: null, misread: [] };
      }
      if (wrong.length < 2) continue;
      const opts = ctx.rng.shuffle([{ text: answer, letter: null as string | null }, ...wrong.slice(0, 2)]);
      return {
        letter: letter.id,
        source: src.kind,
        answer,
        segments,
        mode: "choice",
        options: opts.map((o) => o.text),
        misread: opts.map((o) => o.letter),
      };
    }
    // запасной вариант (не должен понадобиться: isApplicable гарантирует хотя бы один текст)
    const { src, segments } = scored[0]!;
    return { letter: letter.id, source: src.kind, answer: src.ru, segments, mode: "type", options: null, misread: [] };
  },
  check(q, a, c) {
    const ok = normalize(a.value).replace(/[.,!?]/g, "") === normalize(q.answer).replace(/[.,!?]/g, "");
    const letters = mixedLetters(q.segments);
    const verdict = ok ? (a.hinted ? "partial" : "correct") : "wrong";
    // При ошибке в выборе известно, какую букву прочитали неверно — ей и засчитываем ошибку.
    const chosen = q.options?.indexOf(a.value) ?? -1;
    const misread = !ok && chosen >= 0 ? (q.misread[chosen] ?? null) : null;
    const effects: Effect[] = ok
      ? letters.slice(0, 6).map((letter) => ({ letter, skill: "read" as const, verdict }))
      : [{ letter: misread ?? q.letter, skill: "read", verdict: "wrong" }];
    const lines: string[] = [];
    if (ok && a.hinted) lines.push(t("ex.mixedHinted"));
    if (misread) lines.push(t("ex.mixedMisread", { what: describe(byId(c.content, misread)) }));
    else if (!ok && a.value.trim() && q.mode === "type") lines.push(t("ex.youTyped", { answer: a.value }));
    return {
      verdict,
      effects,
      confusions: [],
      explanation: { title: t(ok ? (a.hinted ? "ex.almost" : "ex.correct") : "ex.rightAnswer", { what: `«${q.answer}»` }), lines },
      letter: q.letter,
    };
  },
};
