import { computeScore, currentPrice, productHref } from "@/lib/product-utils";
import { CATEGORIES } from "@/lib/categories";
import type {
  CategoryConfig,
  CategorySlug,
  NewsArticle,
  NewsKind,
  Product,
  SiteSettings,
} from "@/lib/types";

/**
 * Slim, serialisable search index sent to the client command palette.
 * Built on the server from cached catalog data; keep fields minimal —
 * it ships with every page.
 */
export interface SearchProduct {
  slug: string;
  href: string;
  name: string;
  brand: string;
  category: CategorySlug;
  score: number;
  price: number;
  art: { primary: string; accent: string };
  /** headphones drawn as earbuds rather than over-ears */
  earbuds?: true;
}

export interface SearchArticle {
  href: string;
  title: string;
  kind: NewsKind;
  category?: CategorySlug;
  /** yyyy-mm-dd */
  date: string;
}

/** Category fields the header, mobile menu and palette need (not the full spec config). */
export type NavCategory = Pick<CategoryConfig, "slug" | "name" | "shortName" | "tagline" | "icon">;

export function navCategories(): NavCategory[] {
  return CATEGORIES.map(({ slug, name, shortName, tagline, icon }) => ({ slug, name, shortName, tagline, icon }));
}

export interface SearchIndex {
  /** sorted by popularity, most popular first (used for "Trending") */
  products: SearchProduct[];
  articles: SearchArticle[];
}

const MAX_ARTICLES = 40;

function isEarbuds(p: Product): boolean {
  return p.category === "headphones" && /earbud|in-ear/i.test(String(p.specs.type ?? ""));
}

export function buildSearchIndex(
  products: Product[],
  news: NewsArticle[],
  settings: SiteSettings,
): SearchIndex {
  return {
    products: [...products]
      .sort((a, b) => b.popularity - a.popularity)
      .map((p) => ({
        slug: p.slug,
        href: productHref(p),
        name: p.name,
        brand: p.brand,
        category: p.category,
        score: computeScore(p, settings),
        price: currentPrice(p),
        art: { primary: p.art.primary, accent: p.art.accent },
        ...(isEarbuds(p) && { earbuds: true as const }),
      })),
    articles: news.slice(0, MAX_ARTICLES).map((a) => ({
      href: `/news/${a.slug}`,
      title: a.title,
      kind: a.kind,
      category: a.category,
      date: a.publishedAt.slice(0, 10),
    })),
  };
}
