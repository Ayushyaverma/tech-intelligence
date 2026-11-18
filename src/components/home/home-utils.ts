import type { CSSProperties } from "react";
import type { NewsKind } from "@/lib/types";

/**
 * Small helpers shared by the homepage sections.
 *
 * Dates are formatted in India time on purpose: the stored values are UTC,
 * and the server may run in another time zone.
 */
const IST_DAY = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const IST_FULL = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** "16 Nov" */
export function shortDate(iso: string): string {
  return IST_DAY.format(new Date(iso));
}

/** "16 November 2026" */
export function longDate(iso: string): string {
  return IST_FULL.format(new Date(iso));
}

export const KIND_LABELS: Record<NewsKind, string> = {
  launch: "Launch",
  price: "Price watch",
  review: "Review",
  industry: "Industry",
};

export const articleHref = (slug: string) => `/news/${slug}`;
export const guideHref = (slug: string) => `/guides/${slug}`;
export const categoryHref = (slug: string) => `/category/${slug}`;

/**
 * The global `:focus-visible` rule in globals.css sets `border-radius: 6px`
 * and is unlayered, so it beats Tailwind's rounded-* classes. Card-shaped
 * links pass one of these inline styles so their focus ring keeps the
 * card's curve.
 */
export const RADIUS: Record<"card" | "panel" | "hero", CSSProperties> = {
  card: { borderRadius: "var(--radius)" },
  panel: { borderRadius: "var(--radius-lg)" },
  hero: { borderRadius: "var(--radius-xl)" },
};

/** Soft accent-tinted wash used behind device art. */
export function tintedBackdrop(accent: string, primary: string, strength = 22): string {
  return [
    `radial-gradient(70% 70% at 70% 35%, color-mix(in oklab, ${accent} ${strength}%, transparent), transparent 70%)`,
    `radial-gradient(60% 60% at 15% 100%, color-mix(in oklab, ${primary} 10%, transparent), transparent 70%)`,
    "linear-gradient(180deg, var(--surface), var(--surface-2))",
  ].join(", ");
}
