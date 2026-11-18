/**
 * Cached data access for public pages (server components only).
 *
 * Every function is a `'use cache'` function tagged "catalog". Admin server
 * actions call `updateTag(CATALOG_TAG)` after writing, so changes appear
 * immediately. Public functions return only `published` items; the admin
 * uses the `*All` variants.
 */
import { cacheLife, cacheTag } from "next/cache";
import { computeScore, currentPrice, isPublished, priceChange } from "./product-utils";
import { readCollection } from "./store";
import type {
  BuyingGuide,
  CategorySlug,
  NewsArticle,
  Product,
  SiteSettings,
  TrendingComparison,
} from "./types";

export const CATALOG_TAG = "catalog";

function tag() {
  cacheLife("max");
  cacheTag(CATALOG_TAG);
}

/* ---------- settings ---------- */

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  tag();
  return readCollection("settings");
}

/* ---------- products ---------- */

export async function getAllProductsAdmin(): Promise<Product[]> {
  "use cache";
  tag();
  return readCollection("products");
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  tag();
  return readCollection("products").filter(isPublished);
}

export async function getProductsByCategory(category: CategorySlug): Promise<Product[]> {
  "use cache";
  tag();
  return readCollection("products").filter((p) => isPublished(p) && p.category === category);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  "use cache";
  tag();
  return readCollection("products").find((p) => p.slug === slug && isPublished(p));
}

export async function getProductAdmin(id: string): Promise<Product | undefined> {
  "use cache";
  tag();
  return readCollection("products").find((p) => p.id === id);
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  "use cache";
  tag();
  const all = readCollection("products").filter(isPublished);
  return slugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is Product => !!p);
}

/** Products whose price fell the most over the last 30 recorded days. */
export async function getPriceDrops(limit = 8): Promise<Product[]> {
  "use cache";
  tag();
  return readCollection("products")
    .filter(isPublished)
    .map((p) => ({ p, change: priceChange(p, 30).percent }))
    .filter((x) => x.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, limit)
    .map((x) => x.p);
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  "use cache";
  tag();
  return readCollection("products")
    .filter(isPublished)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getTopRated(category?: CategorySlug, limit = 6): Promise<Product[]> {
  "use cache";
  tag();
  const settings = readCollection("settings");
  return readCollection("products")
    .filter((p) => isPublished(p) && (!category || p.category === category))
    .sort((a, b) => computeScore(b, settings) - computeScore(a, settings))
    .slice(0, limit);
}

/** Same-category alternatives closest in price. */
export async function getAlternatives(product: Product, limit = 4): Promise<Product[]> {
  "use cache";
  tag();
  const price = currentPrice(product);
  return readCollection("products")
    .filter((p) => isPublished(p) && p.category === product.category && p.id !== product.id)
    .sort((a, b) => Math.abs(currentPrice(a) - price) - Math.abs(currentPrice(b) - price))
    .slice(0, limit);
}

/* ---------- news ---------- */

export async function getNews(): Promise<NewsArticle[]> {
  "use cache";
  tag();
  return readCollection("news")
    .filter(isPublished)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getAllNewsAdmin(): Promise<NewsArticle[]> {
  "use cache";
  tag();
  return readCollection("news").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getArticle(slug: string): Promise<NewsArticle | undefined> {
  "use cache";
  tag();
  return readCollection("news").find((a) => a.slug === slug && isPublished(a));
}

/* ---------- guides ---------- */

export async function getGuides(): Promise<BuyingGuide[]> {
  "use cache";
  tag();
  return readCollection("guides")
    .filter(isPublished)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getAllGuidesAdmin(): Promise<BuyingGuide[]> {
  "use cache";
  tag();
  return readCollection("guides");
}

export async function getGuide(slug: string): Promise<BuyingGuide | undefined> {
  "use cache";
  tag();
  return readCollection("guides").find((g) => g.slug === slug && isPublished(g));
}

/* ---------- comparisons ---------- */

export async function getTrendingComparisons(): Promise<TrendingComparison[]> {
  "use cache";
  tag();
  return readCollection("comparisons");
}
