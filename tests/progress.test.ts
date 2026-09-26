import { describe, expect, it } from "vitest";
import { backupFileName, parseBackup, serializeBackup } from "../src/core/progress/backup";
import { createEmptyProgress, DEFAULT_SETTINGS, migrate, ProgressFormatError } from "../src/core/progress/schema";
import { createProgressStore, PROGRESS_KEY, type KeyValueStorage } from "../src/core/progress/store";
import { SCHEMA_VERSION } from "../src/core/progress/types";

const NOW = new Date("2026-09-26T10:00:00Z");

function memory(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v), remove: (k) => void map.delete(k) };
}

describe("migrate", () => {
  it("fills missing fields with defaults", () => {
    const data = migrate({ schemaVersion: 2, settings: { theme: "dark" } }, NOW);
    expect(data.settings).toEqual({ ...DEFAULT_SETTINGS, theme: "dark" });
    expect(data.items).toEqual({});
    expect(data.meta.lastBackupAt).toBeNull();
    expect(data.createdAt).toBe(NOW.toISOString());
  });

  it("replaces invalid setting values with defaults", () => {
    const data = migrate({ schemaVersion: 2, settings: { theme: "purple", autoAdvance: "yes" } }, NOW);
    expect(data.settings.theme).toBe("system");
    expect(data.settings.autoAdvance).toBe(true);
  });

  it("keeps existing progress", () => {
    const items = { "letter:tho#recall": { box: 3, due: "2026-10-02", ok: 9, bad: 2, last: "2026-09-25" } };
    expect(migrate({ schemaVersion: 2, items }, NOW).items).toEqual(items);
  });

  it("rejects non-progress data", () => {
    expect(() => migrate({ hello: 1 }, NOW)).toThrow(ProgressFormatError);
    expect(() => migrate(null, NOW)).toThrow(ProgressFormatError);
  });

  it("migrates v1 data to the current version", () => {
    const data = migrate({ schemaVersion: 1, lessons: { "alphabet-1": { completedAt: "2026-09-25" } } }, NOW);
    expect(data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(data.session).toBeNull();
    expect(data.finalTest).toBeNull();
    expect(data.lessons["alphabet-1"]).toEqual({ completedAt: "2026-09-25" });
  });

  it("rejects data from a newer app version", () => {
    try {
      migrate({ schemaVersion: SCHEMA_VERSION + 1 }, NOW);
      expect.unreachable();
    } catch (e) {
      expect((e as ProgressFormatError).reason).toBe("too-new");
    }
  });
});

describe("backup", () => {
  it("round-trips progress", () => {
    const data = createEmptyProgress(NOW);
    data.settings.theme = "dark";
    data.lessons["alphabet-1"] = { completedAt: "2026-09-25" };
    expect(parseBackup(serializeBackup(data, NOW), NOW)).toEqual(data);
  });

  it("rejects foreign JSON and garbage", () => {
    expect(() => parseBackup('{"schemaVersion":1}', NOW)).toThrow(ProgressFormatError);
    expect(() => parseBackup("not json", NOW)).toThrow(ProgressFormatError);
  });

  it("names the file with the date", () => {
    expect(backupFileName(NOW)).toBe("armlanguage-progress-2026-09-26.json");
  });
});

describe("progress store", () => {
  it("starts empty and persists saves", () => {
    const kv = memory();
    const store = createProgressStore(kv, () => NOW);
    const data = store.load();
    expect(data).toEqual(createEmptyProgress(NOW));
    data.settings.showIpa = true;
    store.save(data);
    expect(createProgressStore(kv, () => NOW).load().settings.showIpa).toBe(true);
  });

  it("keeps a copy of corrupted data instead of losing it", () => {
    const kv = memory();
    kv.set(PROGRESS_KEY, "{broken");
    const data = createProgressStore(kv, () => NOW).load();
    expect(data).toEqual(createEmptyProgress(NOW));
    expect(kv.map.get(`${PROGRESS_KEY}:broken:${NOW.toISOString()}`)).toBe("{broken");
  });
});
