import { PALETTE_IDS, SCHEMA_VERSION, type ProgressData, type Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  palette: "ink",
  letterSize: "normal",
  autoAdvance: true,
  strictness: "soft",
  showIpa: false,
  script: "print",
};

export function createEmptyProgress(now: Date): ProgressData {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    items: {},
    lessons: {},
    confusions: {},
    daily: {},
    settings: { ...DEFAULT_SETTINGS },
    session: null,
    finalTest: null,
    games: {},
    themeTests: {},
    meta: { lastBackupAt: null },
  };
}

/** Ошибка формата данных прогресса. `reason` — для объяснения пользователю. */
export class ProgressFormatError extends Error {
  constructor(public readonly reason: "not-progress" | "too-new" | "broken") {
    super(`Неподходящие данные прогресса: ${reason}`);
    this.name = "ProgressFormatError";
  }
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

// Миграции: ключ — версия, ИЗ которой переводим в следующую.
const MIGRATIONS: Record<number, Migration> = {
  // v2: незаконченное занятие и итоговый тест (этап 3)
  1: (d) => ({ ...d, schemaVersion: 2, session: null, finalTest: null }),
  // v3: рекорды мини-игры «Найди пары» (V2)
  2: (d) => ({ ...d, schemaVersion: 3, games: {} }),
  // v4: лучшее чтение на время в итоговом тесте (V2) — поле finalTest.bestReading, заполняется при чтении
  3: (d) => ({ ...d, schemaVersion: 4 }),
  // v5: раздел «Первые слова» — итоговые задания тем
  4: (d) => ({ ...d, schemaVersion: 5, themeTests: {} }),
  // v6: цветовая тема (выпуск 1.1). Прежней абрикосовой темы больше нет — все получают тему по умолчанию.
  5: (d) => ({ ...d, schemaVersion: 6, settings: { ...(isObject(d.settings) ? d.settings : {}), palette: DEFAULT_SETTINGS.palette } }),
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeSettings(raw: unknown): Settings {
  const s = isObject(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;
  return {
    theme: pick(s.theme, ["system", "light", "dark"], d.theme),
    // «Хвоя на бумаге» (pine) переименована в «Дилиджан» (docs/08-decisions.md, 34)
    palette: pick(s.palette === "pine" ? "dilijan" : s.palette, PALETTE_IDS, d.palette),
    letterSize: pick(s.letterSize, ["normal", "large"], d.letterSize),
    autoAdvance: typeof s.autoAdvance === "boolean" ? s.autoAdvance : d.autoAdvance,
    strictness: pick(s.strictness, ["soft", "strict"], d.strictness),
    showIpa: typeof s.showIpa === "boolean" ? s.showIpa : d.showIpa,
    script: pick(s.script, ["print", "handwriting"], d.script),
  };
}

function readingOf(v: unknown): { correct: number; avgMs: number } | null {
  return isObject(v) && typeof v.correct === "number" && typeof v.avgMs === "number" ? { correct: v.correct, avgMs: v.avgMs } : null;
}

const record = (v: unknown): Record<string, never> => (isObject(v) ? (v as Record<string, never>) : {});

/**
 * Приводит данные любой поддерживаемой версии к текущей схеме.
 * Недостающие поля заполняются значениями по умолчанию, так что старые данные не теряются.
 */
export function migrate(raw: unknown, now: Date): ProgressData {
  if (!isObject(raw) || typeof raw.schemaVersion !== "number") {
    throw new ProgressFormatError("not-progress");
  }
  let data = raw;
  let version = raw.schemaVersion;
  if (version > SCHEMA_VERSION) throw new ProgressFormatError("too-new");
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new ProgressFormatError("broken");
    data = step(data);
    version++;
  }
  const meta = isObject(data.meta) ? data.meta : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : now.toISOString(),
    items: record(data.items),
    lessons: record(data.lessons),
    confusions: record(data.confusions),
    daily: record(data.daily),
    settings: normalizeSettings(data.settings),
    // Незаконченное занятие не проверяем подробно: если оно повреждено, его безопаснее сбросить, чем восстанавливать.
    session: isObject(data.session) && Array.isArray(data.session.steps) ? (data.session as unknown as ProgressData["session"]) : null,
    finalTest:
      isObject(data.finalTest) && typeof data.finalTest.bestScore === "number"
        ? {
            bestScore: data.finalTest.bestScore,
            passedAt: typeof data.finalTest.passedAt === "string" ? data.finalTest.passedAt : null,
            bestReading: readingOf(data.finalTest.bestReading),
          }
        : null,
    games: Object.fromEntries(
      Object.entries(record(data.games)).filter(
        ([, g]) => isObject(g) && typeof (g as Record<string, unknown>).bestMs === "number" && typeof (g as Record<string, unknown>).at === "string",
      ),
    ),
    themeTests: Object.fromEntries(
      Object.entries(record(data.themeTests)).flatMap(([id, v]) => {
        const tt = v as unknown;
        if (!isObject(tt) || typeof tt.bestScore !== "number") return [];
        return [[id, { bestScore: tt.bestScore, passedAt: typeof tt.passedAt === "string" ? tt.passedAt : null }]];
      }),
    ),
    meta: { lastBackupAt: typeof meta.lastBackupAt === "string" ? meta.lastBackupAt : null },
  };
}
