/**
 * Date helpers for the admin. All stored datetimes are UTC ISO strings; the
 * admin shows and edits them in India Standard Time (UTC+05:30, no DST), so
 * the conversion is plain arithmetic and identical on server and client.
 */

const IST_OFFSET_MS = 330 * 60_000;

/** "2026-11-15T05:55:00.000Z" → "2026-11-15T11:25" (for <input type="datetime-local">) */
export function isoToIstInput(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/** "2026-11-15T11:25" (IST) → "2026-11-15T05:55:00.000Z" */
export function istInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const t = Date.parse(`${value.slice(0, 16)}:00.000Z`);
  return Number.isNaN(t) ? null : new Date(t - IST_OFFSET_MS).toISOString();
}

/** Calendar date in IST for an ISO datetime: "2026-11-15T20:00:00Z" → "2026-11-16" */
export function isoToIstDate(iso: string): string {
  return isoToIstInput(iso).slice(0, 10);
}

/** Today's date in IST. Only call from event handlers or server actions, never during render. */
export function todayIst(): string {
  return isoToIstDate(new Date().toISOString());
}

/** Whole days between two ISO datetimes or yyyy-mm-dd dates (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const plainDateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "15 Nov 2026, 11:25 am" in IST */
export function formatDateTimeIst(iso: string | undefined): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  return dateTimeFmt.format(new Date(iso));
}

/** "15 Nov 2026" — accepts ISO datetimes (shown in IST) or yyyy-mm-dd dates (shown as-is). */
export function formatDayIst(value: string | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return "—";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? plainDateFmt.format(new Date(`${value}T00:00:00Z`)) : dateFmt.format(new Date(value));
}
