// Даты в прогрессе хранятся как местные календарные дни "YYYY-MM-DD":
// «повторить завтра» должно означать завтра по часам пользователя, а не по UTC.

export type Day = string;

export function toDay(d: Date): Day {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return toDay(new Date(y, m - 1, d + n));
}

/** Сколько дней от a до b (b − a). */
export function daysBetween(a: Day, b: Day): number {
  const parse = (s: Day) => {
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(b) - parse(a)) / 86_400_000);
}
