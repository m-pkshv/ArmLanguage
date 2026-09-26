import type { Letter } from "../content/types";
import type { Strictness } from "../progress/types";
import type { Verdict } from "../progress/srs";

// Правила проверки ввода — docs/03-exercises.md, «Правила проверки ввода».

export function normalize(input: string): string {
  return input.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

// Латинские клавиши → русские буквы на тех же местах раскладки ЙЦУКЕН (для физической клавиатуры).
const LATIN_TO_RU: Record<string, string> = {
  q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ъ",
  a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "э",
  z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю", "`": "ё",
};

/** Символ с физической клавиатуры → русская буква (или null, если это не буква). */
export function keyToRussian(key: string): string | null {
  const k = key.toLowerCase();
  if (/^[а-яё]$/.test(k)) return k;
  return LATIN_TO_RU[k] ?? null;
}

export interface SoundCheck {
  verdict: Verdict;
  expected: string;
}

/** Проверка чтения отдельной буквы (задание «Карточка с вводом»). */
export function checkLetterSound(letter: Letter, input: string, strictness: Strictness): SoundCheck {
  const answer = normalize(input);
  const s = letter.sound;
  const accepted = [s.canonical, ...s.accept, ...(s.initial ? [s.initial.canonical] : [])];
  const partial = [...s.partial, ...(s.initial?.partial ?? [])].filter((p) => !accepted.includes(p));
  let verdict: Verdict = "wrong";
  if (accepted.includes(answer)) verdict = "correct";
  else if (partial.includes(answer)) verdict = strictness === "strict" ? "wrong" : "partial";
  return { verdict, expected: s.canonical };
}

/** Подпись звука в вариантах ответа. Одинаковые чтения различаются (Խ «х» / Հ «h — лёгкое х»). */
export function soundLabel(letter: Letter): string {
  if (letter.sound.choiceLabel) return letter.sound.choiceLabel;
  return letter.sound.initial ? `${letter.sound.canonical}, ${letter.sound.initial.canonical}` : letter.sound.canonical;
}
