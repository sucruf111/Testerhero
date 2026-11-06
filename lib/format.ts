const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const longDateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const dateTimeFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function toDate(value: Date | string) {
  // reine Datumswerte (YYYY-MM-DD) als Mittag interpretieren, damit es keine Zeitzonen-Verschiebung gibt
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`);
  }
  return new Date(value);
}

export const formatDate = (value?: Date | string | null) => (value ? dateFmt.format(toDate(value)) : "–");
export const formatLongDate = (value?: Date | string | null) =>
  value ? longDateFmt.format(toDate(value)) : "–";
export const formatDateTime = (value?: Date | string | null) =>
  value ? dateTimeFmt.format(toDate(value)) : "–";
export const formatEuro = (cents?: number | null) => (cents == null ? null : euro.format(cents / 100));

/** "heute", "vor 3 Tagen" … */
export function formatRelative(value: Date | string) {
  const diff = Date.now() - toDate(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  if (days === 1) return "gestern";
  if (days < 30) return `vor ${days} Tagen`;
  return formatDate(value);
}

/** Heutiges Datum in Deutschland als YYYY-MM-DD */
export function todayBerlin() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

/** Tage bis zur Bewerbungsfrist: 0 = endet heute, negativ = abgelaufen, null = keine Frist */
export function daysUntil(dateString?: string | null) {
  if (!dateString) return null;
  const toUtc = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(dateString) - toUtc(todayBerlin())) / 86_400_000);
}

export function isDeadlinePassed(dateString?: string | null) {
  const d = daysUntil(dateString);
  return d !== null && d < 0;
}

export function deadlineLabel(dateString?: string | null) {
  const d = daysUntil(dateString);
  if (d === null) return null;
  if (d < 0) return "Bewerbungsfrist abgelaufen";
  if (d === 0) return "Endet heute";
  if (d === 1) return "Noch 1 Tag";
  return `Noch ${d} Tage`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
