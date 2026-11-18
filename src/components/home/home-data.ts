import { CATEGORIES } from "@/lib/categories";
import {
  getGuides,
  getNews,
  getPriceDrops,
  getProducts,
  getSettings,
  getTrendingComparisons,
} from "@/lib/data";
import { computeScore, currentPrice, priceChange } from "@/lib/product-utils";
import type { NewsArticle, Product } from "@/lib/types";
import type { ComparisonCardData } from "./trending-comparisons";
import type { CategoryTileData } from "./category-tiles";
import type { FeaturedStory } from "./featured-tech";
import type { GuideCardData } from "./buying-guides";
import type { PriceDropRow } from "./hero-bento";
import type { ReviewCardData } from "./latest-reviews";
import type { HomeStats } from "./stats-strip";

/**
 * Everything the homepage shows, picked from the cached catalogue in one
 * place so the section components stay purely presentational.
 */
export async function loadHomeData() {
  const [settings, products, news, drops, guides, comparisons] = await Promise.all([
    getSettings(),
    getProducts(),
    getNews(),
    getPriceDrops(10),
    getGuides(),
    getTrendingComparisons(),
  ]);

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const scoreOf = (p: Product) => computeScore(p, settings);
  /** first published product an article mentions, else the top product of its category */
  const relatedProduct = (a: NewsArticle): Product | undefined =>
    a.productSlugs.map((s) => bySlug.get(s)).find((p) => p !== undefined) ??
    (a.category ? topOf(products.filter((p) => p.category === a.category), scoreOf)?.product : undefined);

  /* hero: the featured launch story, then the three newest other stories */
  const launchArticle =
    news.find((a) => a.kind === "launch" && a.featured) ?? news.find((a) => a.kind === "launch") ?? news[0];
  const launch = launchArticle ? { article: launchArticle, product: relatedProduct(launchArticle) } : undefined;
  const headlines = news.filter((a) => a !== launchArticle).slice(0, 3);

  const dropItems = drops.map((product) => {
    const change = priceChange(product, 30);
    return {
      product,
      score: scoreOf(product),
      price: currentPrice(product),
      percent: change.percent,
      amount: change.amount,
      points: product.priceHistory.slice(-12).map((p) => p.price),
    };
  });
  const heroDrops: PriceDropRow[] = dropItems.slice(0, 3);

  const stats: HomeStats = {
    products: products.length,
    priceRecords: products.reduce((n, p) => n + p.priceHistory.length + p.offers.length, 0),
    categories: CATEGORIES.length,
    sources: new Set(products.flatMap((p) => p.sources.map((s) => s.url))).size,
  };

  /* featured technology: reviews + industry pieces, featured first, then newest */
  const featured: FeaturedStory[] = news
    .filter((a) => a.kind === "review" || a.kind === "industry")
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 5)
    .map((article) => ({ article, product: relatedProduct(article) }));

  const categoryTiles: CategoryTileData[] = CATEGORIES.map((category) => {
    const inCategory = products.filter((p) => p.category === category.slug);
    return { category, count: inCategory.length, top: topOf(inCategory, scoreOf) };
  });

  const comparisonCards: ComparisonCardData[] = comparisons
    .map((comparison) => ({
      comparison,
      products: comparison.productSlugs
        .map((s) => bySlug.get(s))
        .filter((p): p is Product => p !== undefined)
        .map((product) => ({ product, score: scoreOf(product) })),
    }))
    // a comparison needs at least two live products to be worth showing
    .filter((c) => c.products.length >= 2)
    .slice(0, 8);

  const guideCards: GuideCardData[] = guides.slice(0, 8).map((guide) => ({
    guide,
    picks: guide.picks.map((pick) => bySlug.get(pick.productSlug)).filter((p): p is Product => p !== undefined),
  }));

  const reviews: ReviewCardData[] = categoryTiles
    .map((t) => t.top)
    .filter((t): t is ReviewCardData => t !== undefined)
    .sort((a, b) => b.score - a.score);

  return {
    launch,
    headlines,
    heroDrops,
    dropItems,
    stats,
    featured,
    categoryTiles,
    comparisonCards,
    guideCards,
    reviews,
    updatedAt: news[0]?.publishedAt,
  };
}

function topOf(list: Product[], scoreOf: (p: Product) => number) {
  let best: { product: Product; score: number } | undefined;
  for (const product of list) {
    const score = scoreOf(product);
    if (!best || score > best.score) best = { product, score };
  }
  return best;
}
