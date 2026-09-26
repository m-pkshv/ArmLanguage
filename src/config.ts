// Внешние сервисы. Пустое значение — функция выключена, приложение работает без неё.
export const config = {
  /**
   * Google-форма «Сообщить об ошибке» (docs/02-features.md, 2.9).
   * Ссылка на форму с предзаполнением: в ней {context} заменяется на букву/задание, например
   * "https://docs.google.com/forms/d/e/…/viewform?usp=pp_url&entry.123456={context}".
   */
  feedbackForm: "",
  /** Код сайта в GoatCounter (часть адреса КОД.goatcounter.com). */
  goatcounter: "",
};

/** Ссылка «Сообщить об ошибке» с подставленными техническими данными (без личных данных и ответов). */
export function feedbackUrl(context: string): string | null {
  if (!config.feedbackForm) return null;
  const full = `${context} · v${__APP_VERSION__}`;
  return config.feedbackForm.replace("{context}", encodeURIComponent(full));
}
