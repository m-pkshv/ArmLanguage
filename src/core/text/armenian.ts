import type { Letter } from "../content/types";

/**
 * Разбивает армянское слово на буквы алфавита (в нижнем регистре).
 * ու — одна буква, և — одна буква. Прочие символы (дефис, пробел) пропускаются.
 * "Հայաստան" → ["հ","ա","յ","ա","ս","տ","ա","ն"]
 */
export function splitLetters(word: string): string[] {
  const s = word.toLocaleLowerCase("hy");
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === "ո" && s[i + 1] === "ւ") {
      out.push("ու");
      i++;
    } else if (/[ա-և]/.test(ch)) {
      out.push(ch);
    }
  }
  return out;
}

export type LetterIndex = Map<string, Letter>; // строчная буква → буква алфавита

export function indexLetters(letters: Letter[]): LetterIndex {
  return new Map(letters.map((l) => [l.lower, l]));
}

/** Буквы алфавита, из которых состоит слово. Неизвестные символы → undefined. */
export function lettersOf(word: string, index: LetterIndex): (Letter | undefined)[] {
  return splitLetters(word).map((ch) => index.get(ch));
}

/**
 * Чтение «буква за буквой» по таблице транскрипции (docs/04-content.md):
 * без непроизносимого «ы» и без исключений. "խնձոր" → "хндзор".
 */
export function letterwise(word: string, index: LetterIndex): string {
  return lettersOf(word, index)
    .map((l, i) => {
      if (!l) return "?";
      return i === 0 && l.sound.initial ? l.sound.initial.canonical : l.sound.canonical;
    })
    .join("");
}

/** Разбивает слово на куски для подсветки буквы: "ձուկ", "ու" → [{ձ},{ու, match},{կ}]. */
export function highlightSegments(word: string, lower: string): { text: string; match: boolean }[] {
  const out: { text: string; match: boolean }[] = [];
  for (let i = 0; i < word.length; ) {
    const two = word.slice(i, i + 2);
    const token = two.toLocaleLowerCase("hy") === "ու" ? two : word[i]!;
    const match = token.toLocaleLowerCase("hy") === lower;
    const last = out[out.length - 1];
    if (last && last.match === match && !match) last.text += token;
    else out.push({ text: token, match });
    i += token.length;
  }
  return out;
}
