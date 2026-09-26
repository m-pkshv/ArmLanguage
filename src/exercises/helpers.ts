import { soundLabel } from "../core/checking/answer";
import type { Content, Letter } from "../core/content/types";
import type { Effect } from "../core/progress/knowledge";
import type { Verdict } from "../core/progress/srs";
import type { Skill } from "../core/progress/types";
import type { ExerciseContext } from "./types";

export const byId = (c: Content, id: string): Letter => {
  const l = c.letters.find((x) => x.id === id);
  if (!l) throw new Error(`Нет буквы «${id}»`);
  return l;
};

/** «Ձ ձ» или «և», если заглавной формы нет. */
export const pairText = (l: Letter): string => (l.upper === l.lower ? l.lower : `${l.upper} ${l.lower}`);

/** «Ձ — дза, [дз]» — короткое описание буквы для объяснений. */
export const describe = (l: Letter): string => `${pairText(l)} — «${l.name.ru}», ${soundLabel(l)}`;

/**
 * Неправильные варианты ответа: сначала «пары-ловушки» буквы, затем буквы занятия, затем знакомые, затем любые.
 * `distinct` — ключ, по которому варианты не должны совпадать (например, подпись звука).
 */
export function distractors(
  target: Letter,
  ctx: ExerciseContext,
  count: number,
  opts: { by?: "sound" | "shape"; exclude?: string[]; distinct?: (l: Letter) => string } = {},
): Letter[] {
  const c = ctx.content;
  const exclude = new Set([target.id, ...(opts.exclude ?? [])]);
  const partners = opts.by === "shape" ? target.confusable.shape : [...target.confusable.sound, ...target.confusable.shape];
  const known = new Set([...ctx.focus, ...ctx.known]);
  const tiers = [
    ctx.rng.shuffle(partners.filter((id) => known.has(id))),
    ctx.rng.shuffle(ctx.focus),
    ctx.rng.shuffle(ctx.known),
    ctx.rng.shuffle(partners),
    ctx.rng.shuffle(c.letters.map((l) => l.id)),
  ];
  const out: Letter[] = [];
  const keys = new Set(opts.distinct ? [opts.distinct(target)] : []);
  for (const tier of tiers) {
    for (const id of tier) {
      if (out.length >= count) return out;
      if (exclude.has(id)) continue;
      const l = byId(c, id);
      const key = opts.distinct?.(l);
      if (key !== undefined && keys.has(key)) continue;
      exclude.add(id);
      if (key !== undefined) keys.add(key);
      out.push(l);
    }
  }
  return out;
}

/** Варианты: правильный + неправильные, перемешанные. */
export function withOptions(target: Letter, wrong: Letter[], ctx: ExerciseContext): string[] {
  return ctx.rng.shuffle([target.id, ...wrong.map((l) => l.id)]);
}

/** Эффект на основной навык + «рукописные», если задание показывалось рукописным шрифтом. */
export function effectsFor(letter: string, skill: Skill, verdict: Verdict, handwriting: boolean): Effect[] {
  const e: Effect[] = [{ letter, skill, verdict }];
  if (handwriting) e.push({ letter, skill: "handwriting", verdict });
  return e;
}

export type Form = "upper" | "lower" | "pair";

export function pickForm(ctx: ExerciseContext, letter: Letter): Form {
  if (letter.upper === letter.lower || letter.id === "yev") return "lower";
  return ctx.rng.pick<Form>(["upper", "lower", "pair", "pair"]);
}
