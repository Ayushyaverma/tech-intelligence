/**
 * Date labels for editorial pages. Always formatted in India time so the
 * server render and the browser agree (no hydration mismatch). Accepts full
 * ISO datetimes and plain yyyy-mm-dd dates.
 */
const TZ = "Asia/Kolkata";

const longFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const mediumFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const shortFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: TZ });

/** "16 November 2026" */
export function dateLong(iso: string): string {
  return longFmt.format(new Date(iso));
}

/** "16 Nov 2026" */
export function dateMedium(iso: string): string {
  return mediumFmt.format(new Date(iso));
}

/** "16 Nov" */
export function dateShort(iso: string): string {
  return shortFmt.format(new Date(iso));
}
