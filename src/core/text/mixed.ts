import type { Content } from "../content/types";

// Смешанное письмо: русский текст, где изученные буквы заменены армянскими (docs/03-exercises.md, E09).
// Правила замены:
// - заменяется только буква, чей армянский аналог уже изучен;
// - если аналогов два, берётся основной — первый в content/rules/ru-hy.json (т → Տ, о → Օ, р → Ր…);
// - «дж» → Ջ и «дз» → Ձ заменяются целиком;
// - буквы без аналога («ю», «я», «ё», «щ», «ъ», «ь») и знаки препинания остаются как есть.

export interface MixedSegment {
  /** Что показать: армянская буква или исходный русский текст. */
  text: string;
  /** Исходный русский кусок (для армянской буквы — какой звук она заменила). */
  ru: string;
  /** id армянской буквы, если кусок заменён. */
  letter?: string;
}

export function mixText(ru: string, known: Set<string>, c: Content): MixedSegment[] {
  const rules = Object.entries(c.ruHy).sort((a, b) => b[0].length - a[0].length);
  const byId = new Map(c.letters.map((l) => [l.id, l]));
  const out: MixedSegment[] = [];
  const pushRu = (s: string) => {
    const last = out[out.length - 1];
    if (last && !last.letter) {
      last.text += s;
      last.ru += s;
    } else out.push({ text: s, ru: s });
  };
  for (let i = 0; i < ru.length; ) {
    const lower = ru.slice(i).toLowerCase();
    const rule = rules.find(([key]) => lower.startsWith(key));
    if (!rule) {
      pushRu(ru[i]!);
      i++;
      continue;
    }
    const [key, ids] = rule;
    const chunk = ru.slice(i, i + key.length);
    const primary = byId.get(ids[0]!)!;
    if (known.has(primary.id)) {
      const upper = chunk[0] !== chunk[0]!.toLowerCase();
      out.push({ text: upper && primary.id !== "yev" ? primary.upper : primary.lower, ru: chunk, letter: primary.id });
    } else pushRu(chunk);
    i += key.length;
  }
  return out;
}

/** Буквы, которые реально встречаются в смешанных текстах: основные для какого-нибудь русского звука
 *  и есть хотя бы в одном русском слове или фразе контента (например, для Խ «х» слов пока нет). */
export function mixableLetters(c: Content): Set<string> {
  const all = new Set(c.letters.map((l) => l.id));
  const texts = [...c.ruWords.map((w) => w.ru), ...c.ruPhrases.map((p) => p.ru)];
  const found = new Set<string>();
  for (const t of texts) for (const s of mixText(t, all, c)) if (s.letter) found.add(s.letter);
  return found;
}

export const mixedLetters = (segments: MixedSegment[]): string[] => [...new Set(segments.flatMap((s) => (s.letter ? [s.letter] : [])))];
