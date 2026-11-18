/**
 * Shared data contract for the whole site. Pages, admin and seed data all
 * conform to these types. Change with care: `npm run validate:data` checks
 * the JSON files in /data against the category configs.
 */

export type CategorySlug =
  | "phones"
  | "laptops"
  | "tvs"
  | "headphones"
  | "tablets"
  | "monitors";

export type Tier = "flagship" | "upper-mid" | "mid-range" | "budget";

export type ScoreType = "editorial" | "aggregate" | "benchmark";

export type PublishStatus = "published" | "draft" | "archived";

/** A value stored in product.specs. Booleans for yes/no features. */
export type SpecValue = string | number | boolean;

export interface SpecField {
  /** key used in product.specs */
  key: string;
  label: string;
  /** shown after numeric values, e.g. "GB", "mAh", "Hz" */
  unit?: string;
  /** section on the product page, e.g. "Performance", "Display" */
  group: string;
  type: "number" | "text" | "boolean";
  /** for numeric comparison highlighting; undefined = not comparable */
  higherIsBetter?: boolean;
  /** one-line explanation shown in tooltips / comparison */
  hint?: string;
}

export type FilterDef =
  | { key: "price"; label: string; kind: "price" }
  | { key: "brand"; label: string; kind: "brand" }
  /** checkbox list built from distinct spec values */
  | { key: string; label: string; kind: "options" }
  /** minimum threshold chips, e.g. RAM >= 8, 12, 16 */
  | { key: string; label: string; kind: "min"; steps: number[] }
  /** yes/no toggle for boolean specs */
  | { key: string; label: string; kind: "boolean" };

export interface ScoreCriterion {
  /** key used in product.subScores */
  key: string;
  label: string;
  /** percentage weight; all criteria for a category sum to 100 */
  weight: number;
  description: string;
}

export interface CategoryConfig {
  slug: CategorySlug;
  name: string; // "Smartphones"
  shortName: string; // "Phones"
  singular: string; // "phone"
  tagline: string;
  /** lucide-react icon name: Smartphone, Laptop, Tv, Headphones, Tablet, Monitor */
  icon: "Smartphone" | "Laptop" | "Tv" | "Headphones" | "Tablet" | "Monitor";
  /** order of spec groups on product page */
  specGroups: string[];
  specs: SpecField[];
  /** 3-4 spec keys shown on product cards */
  keySpecs: string[];
  criteria: ScoreCriterion[];
  filters: FilterDef[];
  /** "use-case" needs used by the comparison page's "best for" verdicts */
  needs: { key: string; label: string; criteria: string[] }[];
}

export interface PricePoint {
  /** ISO date yyyy-mm-dd */
  date: string;
  /** INR, whole rupees */
  price: number;
  retailer: string;
}

export interface RetailerOffer {
  retailer: string;
  price: number;
  url: string;
  inStock: boolean;
  /** ISO datetime the price was last verified */
  checkedAt: string;
  /** true if the link earns a commission — must be disclosed */
  affiliate: boolean;
}

export type SourceType = "official" | "review" | "benchmark" | "retailer" | "user";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  type: SourceType;
  /** ISO date accessed/verified */
  accessedAt: string;
}

export interface ExpertReview {
  publisher: string;
  /** 0-10, optional */
  rating?: number;
  summary: string;
  url: string;
  date: string;
}

export interface UserFeedback {
  average: number; // 0-5
  count: number;
  highlights: string[]; // short paraphrased themes
}

export interface Benchmark {
  name: string; // "Geekbench 6 multi-core"
  value: number;
  unit?: string;
  higherIsBetter: boolean;
}

export interface ProductArt {
  /** body colour (hex) */
  primary: string;
  /** accent / screen glow colour (hex) */
  accent: string;
  /** optional real photo path under /public; DeviceArt is used when absent */
  image?: string;
}

export interface Product {
  id: string;
  slug: string;
  category: CategorySlug;
  brand: string;
  name: string; // "Aster One Pro"
  tier: Tier;
  status: PublishStatus;
  releaseDate: string; // ISO date
  tagline: string;
  summary: string;
  colors: { name: string; hex: string }[];
  art: ProductArt;
  /** keys from CategoryConfig.specs */
  specs: Record<string, SpecValue>;
  /** keys from CategoryConfig.criteria, 0-100 each */
  subScores: Record<string, number>;
  scoreType: ScoreType;
  benchmarks: Benchmark[];
  pros: string[];
  cons: string[];
  /** keys from CategoryConfig.needs */
  bestFor: string[];
  /** launch price, INR */
  msrp: number;
  offers: RetailerOffer[];
  /** chronological, oldest first */
  priceHistory: PricePoint[];
  reviews: ExpertReview[];
  userFeedback?: UserFeedback;
  sources: Source[];
  /** passed editorial verification */
  verified: boolean;
  /** ISO datetime */
  updatedAt: string;
  /** 0-100 popularity signal for "trending" + sort */
  popularity: number;
  featured?: boolean;
}

export type NewsKind = "launch" | "price" | "industry" | "review";

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** paragraphs; a paragraph starting with "## " is rendered as a sub-heading */
  body: string[];
  kind: NewsKind;
  tags: string[];
  /** related product slugs */
  productSlugs: string[];
  category?: CategorySlug;
  author: string;
  publishedAt: string; // ISO datetime
  readMinutes: number;
  featured?: boolean;
  status: PublishStatus;
  sources: Source[];
}

export interface GuidePick {
  productSlug: string;
  label: string; // "Best overall"
  reason: string;
}

export interface BuyingGuide {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: CategorySlug;
  /** optional budget ceiling, INR */
  budgetMax?: number;
  picks: GuidePick[];
  body: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  status: PublishStatus;
}

export type AdSlotId =
  | "home-between-news"
  | "category-between-listings"
  | "product-below-specs"
  | "guides-articles"
  | "compare-below-results";

export interface AdSlot {
  id: AdSlotId;
  label: string;
  location: string;
  enabled: boolean;
  sponsor?: string;
  headline?: string;
  body?: string;
  url?: string;
}

export interface SiteSettings {
  siteName: string;
  /** shows the site-wide "sample data" notice */
  demoMode: boolean;
  adSlots: AdSlot[];
  /** optional override of category score weights: { phones: { performance: 20, ... } } */
  weightOverrides?: Partial<Record<CategorySlug, Record<string, number>>>;
  newsletterEnabled: boolean;
}

/** Suggested match-ups shown under "Trending comparisons". */
export interface TrendingComparison {
  id: string;
  title: string;
  category: CategorySlug;
  productSlugs: string[]; // 2-5
}

export interface Subscriber {
  email: string;
  createdAt: string; // ISO datetime
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string; // ISO datetime
}
