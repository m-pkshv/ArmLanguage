import type { Content, Letter, Word } from "../content/types";
import type { Strictness } from "../progress/types";
import type { Verdict } from "../progress/srs";
import { indexLetters, readingOf, tokensOf } from "../text/armenian";
import { normalize } from "./answer";

// Проверка чтения слова целиком (E07, docs/03-exercises.md, «Правила проверки ввода»).
// Ответ сопоставляется с буквами слова: для каждой буквы — какой кусок ответа ей соответствует
// и верно ли он прочитан. Непроизносимое «ы» между согласными можно писать или не писать.

export type LetterStatus = "ok" | "partial" | "wrong";

export interface LetterReading {
  /** Буква, как она написана в слове (с исходным регистром). */
  token: string;
  letter: string;
  /** Чтение этой буквы по правилу (с учётом начала слова). */
  expected: string;
  /** Что пользователь написал на месте этой буквы ("" — пропустил). */
  given: string;
  status: LetterStatus;
}

export interface WordCheck {
  verdict: Verdict;
  letters: LetterReading[];
  /** Ответ «по буквам» без непроизносимого «ы» — верно, но стоит пояснить. */
  schwaOmitted: boolean;
  /** Слово-исключение прочитано по общему правилу. */
  exceptionByRule: boolean;
}

const VOWELS = "аеёиоуыэюя";
const isConsonant = (l: Letter) => !VOWELS.includes(l.sound.canonical[0]!) && !VOWELS.includes(l.sound.canonical.at(-1)!);

/** Какие чтения буквы верны и какие — «почти» (в начале слова свои правила: Ե → «йе», Ո → «во»). */
function readingsOf(l: Letter, first: boolean): { ok: string[]; partial: string[] } {
  const s = l.sound;
  if (first && s.initial) return { ok: [s.initial.canonical, ...s.accept], partial: [...s.initial.partial, ...s.partial] };
  return { ok: [s.canonical, ...s.accept], partial: s.partial };
}

const MAX_PIECE = 5; // сколько букв ответа может прийтись на одну армянскую букву
const WRONG = 100;
const PARTIAL = 1;

/**
 * Сопоставление ответа с буквами слова с наименьшим числом ошибок (динамическое программирование).
 * Возвращает, какой кусок ответа достался каждой букве.
 */
function align(letters: Letter[], answer: string): { given: string; status: LetterStatus }[] {
  const n = letters.length;
  const m = answer.length;
  const readings = letters.map((l, i) => readingsOf(l, i === 0));
  // cost[i][j] — лучшая цена, если прочитаны первые i букв и первые j символов ответа
  const cost: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  const from: { j: number; piece: boolean; status?: LetterStatus }[][] = Array.from({ length: n + 1 }, () => Array(m + 1));
  cost[0]![0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const here = cost[i]![j]!;
      if (here === Infinity) continue;
      // непроизносимое «ы» между двумя согласными
      if (i > 0 && i < n && answer[j] === "ы" && isConsonant(letters[i - 1]!) && isConsonant(letters[i]!) && here < cost[i]![j + 1]!) {
        cost[i]![j + 1] = here;
        from[i]![j + 1] = { j, piece: false };
      }
      if (i === n) continue;
      const r = readings[i]!;
      for (let len = 0; len <= MAX_PIECE && j + len <= m; len++) {
        const piece = answer.slice(j, j + len);
        const status: LetterStatus = r.ok.includes(piece) ? "ok" : r.partial.includes(piece) ? "partial" : "wrong";
        const step = status === "ok" ? 0 : status === "partial" ? PARTIAL : WRONG + Math.abs(len - r.ok[0]!.length) / 10;
        if (here + step < cost[i + 1]![j + len]!) {
          cost[i + 1]![j + len] = here + step;
          from[i + 1]![j + len] = { j, piece: true, status };
        }
      }
    }
  }
  if (cost[n]![m] === Infinity) return letters.map(() => ({ given: "", status: "wrong" }));
  const out: { given: string; status: LetterStatus }[] = [];
  for (let i = n, j = m; i > 0 || j > 0; ) {
    const f = from[i]![j]!;
    if (f.piece) {
      out.unshift({ given: answer.slice(f.j, j), status: f.status! });
      i--;
    }
    j = f.j;
  }
  return out;
}

const compact = (s: string) => normalize(s).replace(/[\s-]/g, "");

export function checkWordReading(word: Word, input: string, c: Content, strictness: Strictness): WordCheck {
  const index = indexLetters(c.letters);
  const tokens = tokensOf(word.hy);
  const letters = tokens.map((tok) => index.get(tok.toLocaleLowerCase("hy"))!);
  const expected = readingOf(tokens, index);
  const answer = compact(input);
  const pron = compact(word.pronunciation);
  const aligned = align(letters, answer);
  const result = (verdict: Verdict, statuses: { given: string; status: LetterStatus }[], extra: Partial<WordCheck> = {}): WordCheck => ({
    verdict,
    letters: tokens.map((token, i) => ({ token, letter: letters[i]!.id, expected: expected[i]!, ...statuses[i]! })),
    schwaOmitted: false,
    exceptionByRule: false,
    ...extra,
  });

  // Ответ совпал с произношением — верно (в том числе для слов-исключений).
  if (answer === pron) {
    const ok = aligned.map((a) => (a.status === "wrong" ? { ...a, status: "ok" as const } : a));
    return result("correct", word.exception ? expected.map((e) => ({ given: e, status: "ok" as const })) : ok);
  }

  const wrong = aligned.some((a) => a.status === "wrong");
  const partial = aligned.some((a) => a.status === "partial");
  if (word.exception) {
    // Исключение, прочитанное по общему правилу, — «почти» (docs/03-exercises.md, правило 5).
    if (!wrong && !partial) return result(strictness === "strict" ? "wrong" : "partial", aligned, { exceptionByRule: true });
    return result("wrong", aligned);
  }
  const verdict: Verdict = wrong ? "wrong" : partial ? (strictness === "strict" ? "wrong" : "partial") : "correct";
  const count = (s: string) => [...s].filter((ch) => ch === "ы").length;
  return result(verdict, aligned, { schwaOmitted: !wrong && count(answer) < count(pron) });
}
