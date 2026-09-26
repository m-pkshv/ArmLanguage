import type { Content } from "./content/types";
import { boxOf, itemOf } from "./progress/knowledge";
import type { ProgressData } from "./progress/types";

// Пары-ловушки: буквы, которые легко спутать по звуку или по виду (docs/02-features.md, 2.8).

export type PairKind = "sound" | "shape";

export interface PairGroup {
  id: string; // "sound:tyun-tho", "shape:da-ghat-pe"
  kind: PairKind;
  letters: string[];
}

/** Все пары из контента: звуковые — парами, по виду — группами (դ/ղ/պ). */
export function pairGroups(c: Content): PairGroup[] {
  const order = new Map(c.letters.map((l, i) => [l.id, i]));
  const sort = (ids: string[]) => [...ids].sort((a, b) => order.get(a)! - order.get(b)!);
  const out = new Map<string, PairGroup>();
  for (const l of c.letters) {
    for (const p of l.confusable.sound) {
      const letters = sort([l.id, p]);
      const id = `sound:${letters.join("-")}`;
      if (!out.has(id)) out.set(id, { id, kind: "sound", letters });
    }
    if (l.confusable.shape.length) {
      const letters = sort([l.id, ...l.confusable.shape]);
      const id = `shape:${letters.join("-")}`;
      if (!out.has(id)) out.set(id, { id, kind: "shape", letters });
    }
  }
  return [...out.values()];
}

/** Группа доступна, когда знакомы хотя бы две её буквы. Возвращает только знакомые буквы. */
export function availableGroups(groups: PairGroup[], known: string[]): PairGroup[] {
  const k = new Set(known);
  return groups.map((g) => ({ ...g, letters: g.letters.filter((id) => k.has(id)) })).filter((g) => g.letters.length >= 2);
}

/** Сколько раз путали буквы группы между собой (в любую сторону). */
export function confusionCount(p: ProgressData, g: PairGroup): number {
  let n = 0;
  for (const a of g.letters) for (const b of g.letters) if (a !== b) n += p.confusions[`letter:${a}>letter:${b}`] ?? 0;
  return n;
}

/** Уверенность в различении: слабейшая буква группы, 0–1 (коробка 3 и выше — уверенно). */
export function groupConfidence(p: ProgressData, g: PairGroup): number | null {
  if (!g.letters.some((id) => itemOf(p, id, "discriminate"))) return null;
  return Math.min(1, Math.min(...g.letters.map((id) => boxOf(p, id, "discriminate"))) / 3);
}

/** Частые путаницы: группы, которые спутали хотя бы min раз, по убыванию. */
export function frequentConfusions(p: ProgressData, groups: PairGroup[], min = 2): { group: PairGroup; count: number }[] {
  return groups
    .map((group) => ({ group, count: confusionCount(p, group) }))
    .filter((x) => x.count >= min)
    .sort((a, b) => b.count - a.count);
}
