import { toCompareItem } from "@/components/compare/compare-item";
import { CATEGORIES } from "@/lib/categories";
import {
  bestOffer,
  computeScore,
  currentPrice,
  effectiveCriteria,
  lowestEver,
  priceChange,
} from "@/lib/product-utils";
import type { CategorySlug, Product, ScoreCriterion, SiteSettings, TrendingComparison } from "@/lib/types";
import type { CompareData, CompareProduct, TrendingCard } from "./types";

/** Server-side: slim a product down to what the comparison page renders. */
function toCompareProduct(p: Product, settings: SiteSettings): CompareProduct {
  const offer = bestOffer(p);
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    tier: p.tier,
    tagline: p.tagline,
    art: p.art,
    specs: p.specs,
    subScores: p.subScores,
    scoreType: p.scoreType,
    pros: p.pros,
    cons: p.cons,
    msrp: p.msrp,
    releaseDate: p.releaseDate,
    verified: p.verified,
    popularity: p.popularity,
    score: computeScore(p, settings),
    price: currentPrice(p),
    lowest: lowestEver(p),
    change30: priceChange(p, 30),
    offer: offer
      ? {
          retailer: offer.retailer,
          price: offer.price,
          url: offer.url,
          inStock: offer.inStock,
          checkedAt: offer.checkedAt,
          affiliate: offer.affiliate,
        }
      : null,
    offerCount: p.offers.length,
    priceHistory: p.priceHistory,
    item: toCompareItem(p),
  };
}

/** Everything the client-side comparison view needs, as plain serialisable data. */
export function buildCompareData(
  products: Product[],
  settings: SiteSettings,
  trending: TrendingComparison[],
): CompareData {
  const list = products.map((p) => toCompareProduct(p, settings)).sort((a, b) => b.popularity - a.popularity);
  const bySlug = new Map(list.map((p) => [p.slug, p]));

  const criteria = Object.fromEntries(
    CATEGORIES.map((c) => [c.slug, effectiveCriteria(c, settings)]),
  ) as Record<CategorySlug, ScoreCriterion[]>;

  const cards: TrendingCard[] = trending
    .map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      products: t.productSlugs
        .map((s) => bySlug.get(s))
        .filter((p): p is CompareProduct => !!p && p.category === t.category)
        .map(({ slug, name, brand, score, price, item }) => ({ slug, name, brand, score, price, item })),
    }))
    .filter((t) => t.products.length >= 2);

  return { products: list, criteria, trending: cards };
}
