import type { Content } from "../core/content/types";
import type { Day } from "../core/dates";
import type { ProgressData } from "../core/progress/types";
import { createRng, type Rng } from "../core/random";
import type { SavedSession, Step, WordExerciseId } from "../core/session/types";
import { dueItems, seenItem, themeById, themeItems, themes } from "../core/words";
import { newSession } from "./plan";

// Занятия раздела «Первые слова» (docs/10-first-words.md, 10.6): урок темы, итоговое задание темы, повторение.

const ex = (item: string, types?: WordExerciseId[]): Step => (types ? { kind: "exercise", letter: item, types } : { kind: "exercise", letter: item });

/** Раскладывает элементы по шагам так, чтобы один элемент не шёл два раза подряд. */
function spread(rng: Rng, items: string[], n: number, types?: WordExerciseId[]): Step[] {
  const out: Step[] = [];
  let bag: string[] = [];
  let last = "";
  while (out.length < n && items.length) {
    if (!bag.length) bag = rng.shuffle(items);
    let i = bag.findIndex((x) => x !== last);
    if (i < 0) i = 0;
    const [x] = bag.splice(i, 1);
    out.push(ex(x!, types));
    last = x!;
  }
  return out;
}

/** Урок темы: разминка по прошлым урокам → знакомство по два элемента с заданиями → закрепление. */
export function planThemeLesson(c: Content, themeId: string, lessonIndex: number, seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const theme = themeById(c, themeId)!;
  const lesson = theme.lessons[lessonIndex]!;
  const items = lesson.newItems;
  const previous = theme.lessons.slice(0, lessonIndex).flatMap((l) => l.newItems);
  const steps: Step[] = [];

  if (previous.length) steps.push(...spread(rng, rng.shuffle(previous).slice(0, 3), 3));

  const introduced: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const chunk = items.slice(i, i + 2);
    for (const id of chunk) steps.push({ kind: "intro", letter: id });
    // по заданию на каждое новое и одно лишнее — так урок укладывается в 20–25 заданий
    steps.push(...spread(rng, chunk, chunk.length + 1));
    if (introduced.length) steps.push(...spread(rng, [...chunk, ...rng.shuffle(introduced).slice(0, 2)], 1));
    introduced.push(...chunk);
  }
  // закрепление: всё новое ещё раз, уже вперемешку
  steps.push(...spread(rng, items, Math.min(items.length, 6)));
  return newSession("theme-lesson", steps, seed, today, { lessonId: lesson.id, themeId });
}

export const THEME_TEST_SIZE = 15;
export const THEME_PASS = 0.8;

/** Итоговое задание темы: 15 заданий по всем словам и фразам темы, без повторов после ошибок. */
export function planThemeTest(c: Content, themeId: string, seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const items = themeItems(themeById(c, themeId)!);
  // вспоминание важнее: в тесте в основном «смысл → армянское»
  const steps = spread(rng, items, THEME_TEST_SIZE).map((s, i) =>
    ({
      ...s,
      types: i % 3 === 0 ? ["word-meaning", "phrase-meaning"] : i % 3 === 1 ? ["word-produce", "phrase-build"] : ["word-build", "phrase-build"],
    }) as Step,
  );
  return newSession("theme-test", steps, seed, today, { themeId }, { retries: false });
}

/** Повторение слов: элементы с наступившим сроком, до 20 заданий. */
export function planWordsReview(c: Content, p: ProgressData, seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const all = themes(c).flatMap(themeItems).filter((id) => seenItem(p, id));
  const due = dueItems(p, today, all).slice(0, 20);
  return newSession("words-review", spread(rng, due, due.length), seed, today);
}

export const wordsDue = (c: Content, p: ProgressData, today: Day): number =>
  dueItems(p, today, themes(c).flatMap(themeItems).filter((id) => seenItem(p, id))).length;
