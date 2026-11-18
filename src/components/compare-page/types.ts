import type { CompareItem } from "@/components/compare/compare-item";
import type {
  CategorySlug,
  PricePoint,
  ProductArt,
  RetailerOffer,
  ScoreCriterion,
  ScoreType,
  SpecValue,
  Tier,
} from "@/lib/types";

/**
 * The serialisable slice of a product the comparison page needs. Built on the
 * server (see build-data.ts) so heavy fields like reviews and sources never
 * reach the browser, and derived numbers (score, prices) are computed once.
 */
export interface CompareProduct {
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  tier: Tier;
  tagline: string;
  art: ProductArt;
  specs: Record<string, SpecValue>;
  subScores: Record<string, number>;
  scoreType: ScoreType;
  pros: string[];
  cons: string[];
  msrp: number;
  releaseDate: string;
  verified: boolean;
  popularity: number;
  /** platform score /100 with admin weight overrides applied */
  score: number;
  /** current best price (lowest in-stock offer) */
  price: number;
  /** lowest recorded price */
  lowest: number;
  change30: { amount: number; percent: number };
  /** cheapest in-stock offer */
  offer: Pick<RetailerOffer, "retailer" | "price" | "url" | "inStock" | "checkedAt" | "affiliate"> | null;
  offerCount: number;
  priceHistory: PricePoint[];
  /** ready-made entry for the shared compare selection */
  item: CompareItem;
}

/** A trending match-up with its products resolved (unpublished products removed). */
export interface TrendingCard {
  id: string;
  title: string;
  category: CategorySlug;
  products: Pick<CompareProduct, "slug" | "name" | "brand" | "score" | "price" | "item">[];
}

export interface CompareData {
  products: CompareProduct[];
  /** effective (override-aware) scoring criteria per category */
  criteria: Record<CategorySlug, ScoreCriterion[]>;
  trending: TrendingCard[];
}
