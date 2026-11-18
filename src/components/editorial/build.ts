import { toCompareItem } from "@/components/compare/compare-item";
import { deviceVariant } from "@/components/device-art";
import { getCategory } from "@/lib/categories";
import {
  bestOffer,
  computeScore,
  currentPrice,
  lastChecked,
  lowestEver,
  priceChange,
  productHref,
} from "@/lib/product-utils";
import type { BuyingGuide, NewsArticle, Product, SiteSettings } from "@/lib/types";
import { dateMedium, dateShort } from "./dates";
import type { ArtRef, ArticleCardData, DealData, GuideCardData } from "./types";

/** Pure helpers (server-safe) that turn stored records into slim card data. */

export function fullName(p: Pick<Product, "brand" | "name">): string {
  return `${p.brand} ${p.name}`;
}

export function toArtRef(p: Pick<Product, "category" | "art" | "specs" | "brand" | "name">): ArtRef {
  const variant = deviceVariant(p);
  return {
    category: p.category,
    primary: p.art.primary,
    accent: p.art.accent,
    name: fullName(p),
    ...(variant ? { variant } : {}),
  };
}

function artsFor(slugs: string[], bySlug: Map<string, Product>, max = 3): ArtRef[] {
  return slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => !!p)
    .slice(0, max)
    .map(toArtRef);
}

export function productMap(products: Product[]): Map<string, Product> {
  return new Map(products.map((p) => [p.slug, p]));
}

export function toArticleCard(a: NewsArticle, bySlug: Map<string, Product>): ArticleCardData {
  return {
    slug: a.slug,
    href: `/news/${a.slug}`,
    title: a.title,
    excerpt: a.excerpt,
    kind: a.kind,
    author: a.author,
    publishedAt: a.publishedAt,
    dateLabel: dateMedium(a.publishedAt),
    readMinutes: a.readMinutes,
    categoryName: a.category ? getCategory(a.category)?.shortName : undefined,
    featured: !!a.featured,
    arts: artsFor(a.productSlugs, bySlug),
  };
}

export function toGuideCard(g: BuyingGuide, bySlug: Map<string, Product>): GuideCardData {
  return {
    slug: g.slug,
    href: `/guides/${g.slug}`,
    title: g.title,
    excerpt: g.excerpt,
    category: g.category,
    categoryName: getCategory(g.category)?.shortName ?? g.category,
    ...(g.budgetMax ? { budgetMax: g.budgetMax } : {}),
    pickCount: g.picks.length,
    updatedAt: g.updatedAt,
    updatedLabel: dateMedium(g.updatedAt),
    author: g.author,
    arts: artsFor(
      g.picks.map((p) => p.productSlug),
      bySlug,
    ),
  };
}

/** Body paragraphs starting with "## " are sub-headings. */
export function isHeading(paragraph: string): boolean {
  return paragraph.startsWith("## ");
}

export function headingText(paragraph: string): string {
  return paragraph.slice(3).trim();
}

/** Stable anchor id for a sub-heading. */
export function headingId(text: string): string {
  return (
    "s-" +
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function extractHeadings(body: string[]): { id: string; text: string }[] {
  return body.filter(isHeading).map((p) => {
    const text = headingText(p);
    return { id: headingId(text), text };
  });
}

/** Split a body into the intro (paragraphs before the first sub-heading) and the rest. */
export function splitIntro(body: string[]): { intro: string[]; rest: string[] } {
  const i = body.findIndex(isHeading);
  if (i === -1) return { intro: body.slice(0, 1), rest: body.slice(1) };
  return { intro: body.slice(0, i), rest: body.slice(i) };
}

/** Recorded prices from the last `days` days before the latest history point. */
export function recentPoints(p: Product, days = 90): number[] {
  const hist = p.priceHistory;
  const last = hist.at(-1);
  if (!last) return [];
  const cutoff = new Date(last.date).getTime() - days * 86_400_000;
  return hist.filter((h) => new Date(h.date).getTime() >= cutoff).map((h) => h.price);
}

export function toDeal(p: Product, settings: SiteSettings): DealData {
  const price = currentPrice(p);
  const change = priceChange(p, 30);
  const offer = bestOffer(p);
  const checked = lastChecked(p);
  return {
    slug: p.slug,
    href: productHref(p),
    brand: p.brand,
    name: p.name,
    category: p.category,
    categoryName: getCategory(p.category)?.shortName ?? p.category,
    art: toArtRef(p),
    compare: toCompareItem(p),
    score: computeScore(p, settings),
    price,
    oldPrice: price - change.amount,
    percent: change.percent,
    amount: change.amount,
    points: recentPoints(p),
    lowestEver: price <= lowestEver(p),
    ...(offer ? { retailer: offer.retailer } : {}),
    ...(checked ? { checkedAt: checked, checkedLabel: dateShort(checked) } : {}),
  };
}
