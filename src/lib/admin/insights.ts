/**
 * Dashboard and table helpers: pure functions over catalog data.
 * "Stale" is measured against the newest checkedAt in the data itself (not
 * the clock), so prerendered pages stay deterministic.
 */
import { CATEGORIES } from "@/lib/categories";
import { computeScore, currentPrice, lastChecked } from "@/lib/product-utils";
import type { BuyingGuide, CategorySlug, NewsArticle, Product, SiteSettings } from "@/lib/types";
import { deviceVariant } from "@/components/device-art";
import { daysBetween } from "./dates";
import { productTitle } from "./templates";

export const STALE_DAYS = 7;

/** Newest offer check across every product (ISO), the reference point for staleness. */
export function latestCheck(products: Product[]): string | undefined {
  return products.map(lastChecked).filter((x): x is string => !!x).sort().at(-1);
}

/** Days since a product's freshest offer check, relative to the newest check in the data. */
export function staleDays(product: Product, reference: string | undefined): number | null {
  const checked = lastChecked(product);
  if (!checked || !reference) return null;
  return daysBetween(checked, reference);
}

/** Slim row for client tables (keeps the RSC payload small). */
export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  brand: string;
  name: string;
  category: CategorySlug;
  tier: Product["tier"];
  status: Product["status"];
  verified: boolean;
  featured: boolean;
  score: number;
  price: number;
  updatedAt: string;
  lastChecked?: string;
  staleDays: number | null;
  offers: number;
  sources: number;
  art: Product["art"];
  variant?: ReturnType<typeof deviceVariant>;
}

export function toProductRow(p: Product, settings: SiteSettings, reference: string | undefined): ProductRow {
  return {
    id: p.id,
    slug: p.slug,
    title: productTitle(p),
    brand: p.brand,
    name: p.name,
    category: p.category,
    tier: p.tier,
    status: p.status,
    verified: p.verified,
    featured: !!p.featured,
    score: computeScore(p, settings),
    price: currentPrice(p),
    updatedAt: p.updatedAt,
    lastChecked: lastChecked(p),
    staleDays: staleDays(p, reference),
    offers: p.offers.length,
    sources: p.sources.length,
    art: p.art,
    variant: deviceVariant(p),
  };
}

export interface AttentionItem {
  id: string;
  kind: "stale" | "unverified" | "draft" | "article-draft" | "guide-draft";
  title: string;
  detail: string;
  href: string;
}

export function needsAttention(
  products: Product[],
  news: NewsArticle[],
  guides: BuyingGuide[],
): AttentionItem[] {
  const reference = latestCheck(products);
  const items: AttentionItem[] = [];
  for (const p of products) {
    if (p.status === "archived") continue;
    const href = `/admin/products/${p.id}`;
    const days = staleDays(p, reference);
    if (days !== null && days > STALE_DAYS) {
      items.push({ id: `stale-${p.id}`, kind: "stale", title: productTitle(p), detail: `Prices last checked ${days} days before the latest update`, href: `/admin/prices?q=${encodeURIComponent(p.slug)}` });
    }
    if (p.status === "draft") {
      items.push({ id: `draft-${p.id}`, kind: "draft", title: productTitle(p), detail: "Draft product — finish the checklist and publish", href });
    } else if (!p.verified) {
      items.push({ id: `unverified-${p.id}`, kind: "unverified", title: productTitle(p), detail: "Published but not yet verified", href: `${href}#verify` });
    }
  }
  for (const a of news) {
    if (a.status === "draft") items.push({ id: `n-${a.id}`, kind: "article-draft", title: a.title, detail: "Article draft", href: `/admin/news/${a.id}` });
  }
  for (const g of guides) {
    if (g.status === "draft") items.push({ id: `g-${g.id}`, kind: "guide-draft", title: g.title, detail: "Guide draft", href: `/admin/guides/${g.id}` });
  }
  return items;
}

export interface CategoryStat {
  slug: CategorySlug;
  name: string;
  published: number;
  draft: number;
  archived: number;
  avgScore: number;
}

export function categoryStats(products: Product[], settings: SiteSettings): CategoryStat[] {
  return CATEGORIES.map((c) => {
    const inCat = products.filter((p) => p.category === c.slug);
    const live = inCat.filter((p) => p.status === "published");
    const avg = live.length ? Math.round(live.reduce((s, p) => s + computeScore(p, settings), 0) / live.length) : 0;
    return {
      slug: c.slug,
      name: c.shortName,
      published: live.length,
      draft: inCat.filter((p) => p.status === "draft").length,
      archived: inCat.filter((p) => p.status === "archived").length,
      avgScore: avg,
    };
  });
}

/** Score histogram in 5-point bins for published products. */
export function scoreDistribution(products: Product[], settings: SiteSettings) {
  const scores = products.filter((p) => p.status === "published").map((p) => computeScore(p, settings));
  if (!scores.length) return [];
  const lo = Math.floor(Math.min(...scores) / 5) * 5;
  const hi = Math.floor(Math.max(...scores) / 5) * 5;
  const bins: { range: string; from: number; count: number }[] = [];
  for (let from = lo; from <= hi; from += 5) {
    bins.push({ range: `${from}–${from + 4}`, from, count: scores.filter((s) => s >= from && s < from + 5).length });
  }
  return bins;
}
