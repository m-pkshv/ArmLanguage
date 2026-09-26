// Предсказуемый генератор случайных чисел: одно и то же зерно → те же задания.
// Нужен, чтобы продолжить занятие с того же места и чтобы тесты были воспроизводимыми.

export interface Rng {
  next(): number; // [0, 1)
  int(n: number): number; // 0..n-1
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  return {
    next,
    int,
    pick: (items) => {
      if (!items.length) throw new Error("pick from empty list");
      return items[int(items.length)]!;
    },
    shuffle: (items) => {
      const a = [...items];
      for (let i = a.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [a[i], a[j]] = [a[j]!, a[i]!];
      }
      return a;
    },
  };
}

/** Зерно для шага занятия: разные шаги — разные задания, но повторяемо. */
export const stepSeed = (seed: number, step: number): number => (Math.imul(seed ^ 0x9e3779b9, 31) + step * 7919) >>> 0;
