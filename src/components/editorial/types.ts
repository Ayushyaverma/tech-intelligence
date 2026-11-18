import type { CompareItem } from "@/components/compare/compare-item";
import type { DeviceVariant } from "@/components/device-art";
import type { CategorySlug, NewsKind } from "@/lib/types";

/**
 * Slim, serialisable shapes passed from server pages to editorial client
 * islands. Build them with the helpers in ./build.ts.
 */

/** Colours + shape needed to draw a product with DeviceArt. */
export interface ArtRef {
  category: CategorySlug;
  primary: string;
  accent: string;
  variant?: DeviceVariant;
  /** accessible name, e.g. "Kairo X5" */
  name: string;
}

export interface ArticleCardData {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  kind: NewsKind;
  author: string;
  /** ISO datetime (for <time dateTime>) */
  publishedAt: string;
  /** pre-formatted in IST, e.g. "16 Nov 2026" */
  dateLabel: string;
  readMinutes: number;
  categoryName?: string;
  featured: boolean;
  /** up to three related products for the visual */
  arts: ArtRef[];
}

export interface GuideCardData {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: CategorySlug;
  categoryName: string;
  budgetMax?: number;
  pickCount: number;
  updatedLabel: string;
  updatedAt: string;
  author: string;
  arts: ArtRef[];
}

/** One row on /deals (a product whose recorded price moved over 30 days). */
export interface DealData {
  slug: string;
  href: string;
  brand: string;
  /** model name without the brand, as stored */
  name: string;
  category: CategorySlug;
  categoryName: string;
  art: ArtRef;
  compare: CompareItem;
  score: number;
  price: number;
  /** recorded price 30 days before the latest check */
  oldPrice: number;
  percent: number;
  amount: number;
  /** recent recorded prices for the sparkline */
  points: number[];
  /** current price is the lowest we have ever recorded */
  lowestEver: boolean;
  retailer?: string;
  checkedAt?: string;
  checkedLabel?: string;
}
