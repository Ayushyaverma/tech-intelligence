import { formatSpec } from "@/lib/product-utils";
import type { ScoreType, SourceType, SpecField, SpecValue } from "@/lib/types";

/**
 * Small, pure helpers shared by the product-page components.
 * Dates are always formatted with an explicit time zone so the server and
 * the browser print the same text (no hydration mismatches).
 */

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** "18 Sept 2026" for a date-only string (yyyy-mm-dd) or an ISO datetime (shown in IST). */
export function formatDay(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return dayFmt.format(Date.UTC(y, m - 1, d));
  }
  // Datetimes: shift into IST before taking the calendar day.
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(
    new Date(iso),
  );
}

/** "15 Nov 2026, 11:25 am IST" */
export function formatDateTimeIST(iso: string): string {
  return `${dateTimeFmt.format(new Date(iso))} IST`;
}

/**
 * Spec value for display. Numeric specs stored as 0 mean "feature absent"
 * (e.g. USB-C power on a monitor without it), so they read "None" instead of "0 W".
 */
export function specText(field: SpecField | undefined, value: SpecValue | undefined): string {
  if (typeof value === "number" && value === 0 && (field?.unit || field?.higherIsBetter !== undefined)) return "None";
  return formatSpec(field, value);
}

/** Is a spec value meaningful (not missing, false or zero)? */
export function hasValue(value: SpecValue | undefined): boolean {
  return value !== undefined && value !== "" && value !== false && value !== 0;
}

export const SCORE_TYPE_LABELS: Record<ScoreType, { label: string; description: string }> = {
  editorial: {
    label: "Editorial score",
    description: "Scored by our editors from hands-on testing, weighted by the category criteria.",
  },
  aggregate: {
    label: "Multi-source aggregate",
    description: "Combined from several independent reviews and lab results, normalised to our criteria.",
  },
  benchmark: {
    label: "Benchmark-derived",
    description: "Calculated mainly from measured benchmark results against the category.",
  },
};

export const SOURCE_TYPE_LABELS: Record<SourceType, { label: string; tone: "accent" | "positive" | "warning" | "neutral" }> = {
  official: { label: "Official", tone: "accent" },
  review: { label: "Review", tone: "positive" },
  benchmark: { label: "Lab / benchmark", tone: "warning" },
  retailer: { label: "Retailer", tone: "neutral" },
  user: { label: "User reports", tone: "neutral" },
};

/** Number with Indian grouping and up to 2 decimals. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: n < 10 ? 2 : 1 });
}

/** Deterministic soft colour for a retailer / publisher initial avatar. */
export function avatarHue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}
