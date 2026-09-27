// «Что нового» после обновления приложения (docs/09-navigation.md, 9.16).
// Новая версия: повысить version в package.json, добавить выпуск в RELEASES и тексты в ru.json (whatsNew.rX_Y).

export interface Release {
  /** Короткий номер версии, как в «О проекте»: «1.0». */
  version: string;
  /** Ключ списка в ru.json: whatsNew.<key>.<пункт>. */
  key: string;
  items: string[];
}

export const RELEASES: Release[] = [{ version: "1.0", key: "r1_0", items: ["words", "continue", "review", "mine"] }];

/** «1.0.0» → «1.0», «1.2.3» → «1.2.3». */
export const shortVersion = (v: string): string => v.replace(/^(\d+\.\d+)\.0$/, "$1");

/** Ключ localStorage: какая версия уже показана на этом устройстве (удобство, не часть прогресса). */
export const SEEN_KEY = "hy:seen-version";

/**
 * Какой выпуск показать при запуске: только тем, кто уже занимался, один раз на версию
 * и только если для текущей версии есть список изменений.
 */
export function releaseToShow(seen: string | null, current: string, started: boolean): Release | undefined {
  const v = shortVersion(current);
  if (!started || seen === v) return undefined;
  return RELEASES.find((r) => r.version === v);
}
