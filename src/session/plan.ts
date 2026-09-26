import { alphabetLessons, lessonLetters } from "../core/course";
import type { Content } from "../core/content/types";
import type { Day } from "../core/dates";
import { boxOf, dueLetters } from "../core/progress/knowledge";
import type { ProgressData } from "../core/progress/types";
import { createRng, type Rng } from "../core/random";
import type { ExerciseId, SavedSession, SessionKind, SessionOptions, Step } from "../core/session/types";

// Состав занятий (docs/09-navigation.md, 9.6): урок, повторение, тренировка, итоговый тест.

const ex = (letter: string, types?: ExerciseId[]): Step => (types ? { kind: "exercise", letter, types } : { kind: "exercise", letter });

/** Раскладывает буквы по шагам так, чтобы одна буква не шла два раза подряд. */
function spread(rng: Rng, letters: string[], n: number, types?: ExerciseId[]): Step[] {
  const out: Step[] = [];
  let bag: string[] = [];
  let last = "";
  while (out.length < n && letters.length) {
    if (!bag.length) bag = rng.shuffle(letters);
    let i = bag.findIndex((l) => l !== last);
    if (i < 0) i = 0;
    const [l] = bag.splice(i, 1);
    out.push(ex(l!, types));
    last = l!;
  }
  return out;
}

export function newSession(kind: SessionKind, steps: Step[], seed: number, today: Day, extra: Partial<SavedSession> = {}, options: SessionOptions = {}): SavedSession {
  return { kind, seed, steps, index: 0, result: { correct: 0, partial: 0, wrong: 0, wrongByLetter: {} }, options: { retries: true, ...options }, startedAt: today, ...extra };
}

/** Урок: разминка → знакомство с буквами по две и задания на них → закрепление с повторением. */
export function planLesson(c: Content, p: ProgressData, lessonIndex: number, seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const lessons = alphabetLessons(c);
  const lesson = lessons[lessonIndex]!;
  const letters = lessonLetters(lesson);
  const previous = lessons.slice(0, lessonIndex).flatMap(lessonLetters);
  const steps: Step[] = [];

  if (previous.length) steps.push(...spread(rng, rng.shuffle(previous).slice(0, 3), 3, ["letter-to-sound"]));

  const introduced: string[] = [];
  for (let i = 0; i < letters.length; i += 2) {
    const chunk = letters.slice(i, i + 2);
    for (const l of chunk) steps.push({ kind: "intro", letter: l });
    const n = chunk.length === 2 ? 4 : 2;
    steps.push(...spread(rng, chunk, n));
    if (introduced.length) steps.push(...spread(rng, [...chunk, ...introduced], 2));
    introduced.push(...chunk);
  }

  const due = dueLetters(p, today, previous).slice(0, 3);
  const consolidation = spread(rng, letters, 7);
  // Вторая буква пары-ловушки пришла в этом уроке — сразу задание на различение (docs/02-features.md, 2.8)
  const known = new Set([...previous, ...letters]);
  for (const id of letters) {
    const letter = c.letters.find((l) => l.id === id)!;
    const partners = letter.confusable.sound.filter((pid) => previous.includes(pid) || (known.has(pid) && letters.indexOf(pid) < letters.indexOf(id)));
    if (partners.length) consolidation.push({ kind: "exercise", letter: id, types: ["confusable-pair"], pair: partners });
  }
  for (const d of due) consolidation.splice(rng.int(consolidation.length + 1), 0, ex(d));
  steps.push(...consolidation);

  return newSession("lesson", steps, seed, today, { lessonId: lesson.id });
}

/** Повторение: буквы с наступившим сроком, до 30 заданий (docs/02-features.md, 2.8). */
export function planReview(p: ProgressData, known: string[], seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const due = dueLetters(p, today, known).slice(0, 15);
  const steps: Step[] = [];
  for (const id of due) {
    const weak = Math.min(boxOf(p, id, "recognize"), boxOf(p, id, "recall")) < 2;
    steps.push(ex(id));
    if (weak) steps.push(ex(id));
  }
  return newSession("review", spreadSteps(rng, steps).slice(0, 30), seed, today);
}

/** Своя тренировка: выбранные буквы и типы заданий; слабые буквы выпадают чаще. */
export function planPractice(p: ProgressData, letters: string[], types: ExerciseId[], length: number, script: SessionOptions["script"], seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const weighted = letters.flatMap((id) => {
    const box = Math.min(boxOf(p, id, "recognize"), boxOf(p, id, "recall"));
    return Array(box >= 3 ? 1 : box >= 1 ? 2 : 3).fill(id) as string[];
  });
  const steps = spread(rng, weighted, length).map((s) => ({ ...s, types }) as Step);
  return newSession("practice", steps, seed, today, {}, { script });
}

/** Тренировка одной буквы из её карточки: буква + её пары-ловушки. */
export function planLetter(c: Content, letterId: string, known: string[], seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const letter = c.letters.find((l) => l.id === letterId)!;
  const partners = [...letter.confusable.sound, ...letter.confusable.shape].filter((id) => known.includes(id));
  const steps = [...Array(5)].map(() => ex(letterId));
  steps.push(...spread(rng, partners.length ? partners : [letterId], 3));
  return newSession("letter", spreadSteps(rng, steps), seed, today, { letterId });
}

/** Тренажёр пар-ловушек: 10 заданий на выбранные пары (docs/02-features.md, 2.8). */
export function planPairs(groups: { letters: string[] }[], seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const steps: Step[] = [];
  for (let i = 0; i < 10; i++) {
    const g = groups[i % groups.length]!;
    const letter = g.letters[rng.int(g.letters.length)]!;
    steps.push({ kind: "exercise", letter, types: ["confusable-pair"], pair: g.letters.filter((id) => id !== letter) });
  }
  return newSession("pairs", spreadSteps(rng, steps), seed, today);
}

/** Итоговый тест: 40 заданий по всем буквам, без повторов после ошибок (docs/02-features.md, 2.5). */
export const FINAL_TEST_TYPES: ExerciseId[] = ["letter-to-sound", "sound-to-letter", "letter-type-sound", "ru-word-insert", "case-match"];

export function planFinalTest(c: Content, seed: number, today: Day): SavedSession {
  const rng = createRng(seed);
  const letters = rng.shuffle(c.letters.map((l) => l.id));
  letters.push(rng.pick(letters));
  const steps = letters.map((id, i) => ex(id, [FINAL_TEST_TYPES[i % FINAL_TEST_TYPES.length]!]));
  return newSession("final", rng.shuffle(steps), seed, today, {}, { retries: false });
}

/** Перемешать шаги, стараясь не ставить одну букву два раза подряд. */
function spreadSteps(rng: Rng, steps: Step[]): Step[] {
  const pool = rng.shuffle(steps);
  const out: Step[] = [];
  while (pool.length) {
    const lastLetter = out[out.length - 1]?.letter;
    const i = Math.max(0, pool.findIndex((s) => s.letter !== lastLetter));
    out.push(...pool.splice(i, 1));
  }
  return out;
}
