import { migrate, ProgressFormatError } from "./schema";
import type { ProgressData } from "./types";

// Файл резервной копии: обёртка с пометкой приложения, чтобы не принять за прогресс чужой JSON.
const APP_ID = "armlanguage";

interface BackupFile {
  app: typeof APP_ID;
  kind: "progress";
  exportedAt: string;
  data: ProgressData;
}

export function serializeBackup(data: ProgressData, now: Date): string {
  const file: BackupFile = { app: APP_ID, kind: "progress", exportedAt: now.toISOString(), data };
  return JSON.stringify(file, null, 2);
}

export function backupFileName(now: Date): string {
  const d = now.toISOString().slice(0, 10);
  return `armlanguage-progress-${d}.json`;
}

/** Разбирает текст файла резервной копии. Бросает ProgressFormatError, если файл не подходит. */
export function parseBackup(text: string, now: Date): ProgressData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ProgressFormatError("not-progress");
  }
  if (typeof json !== "object" || json === null) throw new ProgressFormatError("not-progress");
  const file = json as Partial<BackupFile>;
  if (file.app !== APP_ID || file.kind !== "progress") throw new ProgressFormatError("not-progress");
  return migrate(file.data, now);
}
