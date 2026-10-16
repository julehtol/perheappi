export const TZ = "Europe/Helsinki";

export const WEEKDAYS = ["maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai", "sunnuntai"];
export const WEEKDAYS_SHORT = ["ma", "ti", "ke", "to", "pe", "la", "su"];
export const MONTHS = [
  "tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu",
  "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu",
];

/** Tämä päivä Suomen aikaa muodossa YYYY-MM-DD. */
export function today(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());
}

function parse(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: string, n: number) {
  const x = parse(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fmt(x);
}

/** 0 = maanantai ... 6 = sunnuntai */
export function weekdayIndex(d: string) {
  return (parse(d).getUTCDay() + 6) % 7;
}

export function startOfWeek(d: string) {
  return addDays(d, -weekdayIndex(d));
}

export function weekNumber(d: string) {
  const x = parse(d);
  x.setUTCDate(x.getUTCDate() - weekdayIndex(d) + 3);
  const yearStart = Date.UTC(x.getUTCFullYear(), 0, 1);
  return Math.ceil(((x.getTime() - yearStart) / 86400000 + 1) / 7);
}

export function dayLabel(d: string) {
  const t = today();
  if (d === t) return "Tänään";
  if (d === addDays(t, 1)) return "Huomenna";
  if (d === addDays(t, -1)) return "Eilen";
  const x = parse(d);
  return `${capitalize(WEEKDAYS[weekdayIndex(d)])} ${x.getUTCDate()}.${x.getUTCMonth() + 1}.`;
}

export function shortDate(d: string) {
  const x = parse(d);
  return `${x.getUTCDate()}.${x.getUTCMonth() + 1}.`;
}

export function monthOf(d: string) {
  return d.slice(0, 7);
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${capitalize(MONTHS[m - 1])} ${y}`;
}

export function addMonths(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1 + n, 1));
  return fmt(x).slice(0, 7);
}

export function isDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
