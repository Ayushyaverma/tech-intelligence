/**
 * Server-side helpers for the category pages: turn full products into the
 * slim, serialisable CatalogEntry list the client explorer needs, and work
 * out the summary stats shown in the page header and on category cards.
 */
import { computeScore, currentPrice, lastChecked } from "@/lib/product-utils";
import type { CategoryConfig, PricePoint, Product, SiteSettings } from "@/lib/types";
import { TIER_LABELS } from "@/components/product-card";
import type { CatalogEntry } from "./catalog-query";

/** Enough history for the card sparkline (last 16 points) and the 30-day change. */
const HISTORY_WINDOW_DAYS = 150;

function trimHistory(history: PricePoint[]): PricePoint[] {
  if (history.length <= 20) return history;
  const start = Date.parse(history[history.length - 1].date) - HISTORY_WINDOW_DAYS * 86_400_000;
  const firstInside = history.findIndex((p) => Date.parse(p.date) >= start);
  // keep one point before the window so priceChange() finds the same reference price
  return history.slice(Math.max(0, firstInside - 1));
}

/**
 * A copy of the product with the heavy editorial fields emptied. ProductCard
 * only reads identity, specs, offers and recent price history, so the client
 * payload stays small.
 */
function toListingProduct(p: Product): Product {
  return {
    ...p,
    summary: "",
    colors: [],
    benchmarks: [],
    pros: [],
    cons: [],
    bestFor: [],
    reviews: [],
    sources: [],
    userFeedback: undefined,
    priceHistory: trimHistory(p.priceHistory),
  };
}

export function buildCatalogEntries(
  products: Product[],
  category: CategoryConfig,
  settings: SiteSettings,
): CatalogEntry[] {
  return products.map((p) => {
    const textSpecs = category.specs
      .filter((s) => s.type === "text")
      .map((s) => p.specs[s.key])
      .filter((v): v is string => typeof v === "string");
    return {
      product: toListingProduct(p),
      score: computeScore(p, settings),
      price: currentPrice(p),
      haystack: [p.brand, p.name, p.tagline, TIER_LABELS[p.tier], ...textSpecs].join(" ").toLowerCase(),
    };
  });
}

export interface CategoryStats {
  count: number;
  brandCount: number;
  minPrice: number;
  maxPrice: number;
  avgScore: number;
  topBrand?: { name: string; avgScore: number; count: number };
  topPick?: CatalogEntry;
  /** newest offer check across the category (ISO) */
  lastChecked?: string;
}

export function categoryStats(entries: CatalogEntry[]): CategoryStats {
  if (!entries.length) return { count: 0, brandCount: 0, minPrice: 0, maxPrice: 0, avgScore: 0 };
  const prices = entries.map((e) => e.price);

  const byBrand = new Map<string, number[]>();
  for (const e of entries) byBrand.set(e.product.brand, [...(byBrand.get(e.product.brand) ?? []), e.score]);
  const brands = [...byBrand].map(([name, scores]) => ({
    name,
    count: scores.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));
  brands.sort((a, b) => b.avgScore - a.avgScore || b.count - a.count || a.name.localeCompare(b.name));

  return {
    count: entries.length,
    brandCount: brands.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgScore: Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length),
    topBrand: brands[0],
    topPick: [...entries].sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity)[0],
    lastChecked: entries
      .map((e) => lastChecked(e.product))
      .filter((d): d is string => !!d)
      .sort()
      .at(-1),
  };
}

/** Up to three products for the header montage: the top pick first, then other brands. */
export function montageEntries(entries: CatalogEntry[]): CatalogEntry[] {
  const ranked = [...entries].sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity);
  const picks: CatalogEntry[] = [];
  for (const e of ranked) {
    if (picks.length === 3) break;
    if (!picks.some((p) => p.product.brand === e.product.brand)) picks.push(e);
  }
  for (const e of ranked) {
    if (picks.length === 3) break;
    if (!picks.includes(e)) picks.push(e);
  }
  return picks;
}

const checkedFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** Stored ISO datetime → "16 Nov 2026" in Indian time (server-rendered only). */
export function formatCheckedDate(iso: string) {
  return checkedFmt.format(new Date(iso));
}
