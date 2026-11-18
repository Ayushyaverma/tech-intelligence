/**
 * Blank records and small pure helpers shared by the admin editors (client)
 * and the server actions. No I/O here.
 */
import { requireCategory } from "@/lib/categories";
import { slugify } from "@/lib/format";
import type {
  BuyingGuide,
  CategorySlug,
  NewsArticle,
  Product,
  Source,
  SpecValue,
} from "@/lib/types";

/** Result shape returned by every admin server action (works with useActionState). */
export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  message?: string;
  /** id of the record that was created/updated */
  id?: string;
  /** server timestamp, so two identical successes in a row still re-trigger effects */
  at?: number;
  /** the saved record, normalised by the server (editors reset to it) */
  data?: T;
}

export const IDLE: ActionResult = { ok: false };

export const TIER_OPTIONS = [
  { value: "flagship", label: "Flagship" },
  { value: "upper-mid", label: "Upper mid" },
  { value: "mid-range", label: "Mid-range" },
  { value: "budget", label: "Budget" },
] as const;

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export const SCORE_TYPE_OPTIONS = [
  { value: "editorial", label: "Editorial", hint: "Our own testing and judgement" },
  { value: "aggregate", label: "Multi-source aggregate", hint: "Averaged from several reviews" },
  { value: "benchmark", label: "Benchmark-derived", hint: "Calculated from measured results" },
] as const;

export const NEWS_KIND_OPTIONS = [
  { value: "launch", label: "Launch" },
  { value: "price", label: "Price" },
  { value: "review", label: "Review" },
  { value: "industry", label: "Industry" },
] as const;

export const SOURCE_TYPE_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "review", label: "Review" },
  { value: "benchmark", label: "Benchmark" },
  { value: "retailer", label: "Retailer" },
  { value: "user", label: "User reports" },
] as const;

export const RETAILER_SUGGESTIONS = ["Amazon", "Flipkart", "Croma", "Reliance Digital", "Vijay Sales", "Brand store"];

/** Spec sheet for a category with every key present ("" = not filled in yet). */
export function emptySpecs(category: CategorySlug): Record<string, SpecValue> {
  const specs: Record<string, SpecValue> = {};
  for (const f of requireCategory(category).specs) specs[f.key] = f.type === "boolean" ? false : "";
  return specs;
}

/** Every criterion at 0 (= not scored yet). */
export function emptySubScores(category: CategorySlug): Record<string, number> {
  return Object.fromEntries(requireCategory(category).criteria.map((c) => [c.key, 0]));
}

export function emptyProduct(category: CategorySlug = "phones"): Product {
  return {
    id: "",
    slug: "",
    category,
    brand: "",
    name: "",
    tier: "mid-range",
    status: "draft",
    releaseDate: "",
    tagline: "",
    summary: "",
    colors: [{ name: "Graphite", hex: "#2f3136" }],
    art: { primary: "#2f3136", accent: "#8b93ff" },
    specs: emptySpecs(category),
    subScores: emptySubScores(category),
    scoreType: "editorial",
    benchmarks: [],
    pros: [],
    cons: [],
    bestFor: [],
    msrp: 0,
    offers: [],
    priceHistory: [],
    reviews: [],
    sources: [],
    verified: false,
    updatedAt: "",
    popularity: 50,
    featured: false,
  };
}

/** Switching category invalidates the spec sheet, scores and "best for" needs. */
export function resetForCategory(p: Product, category: CategorySlug): Product {
  return { ...p, category, specs: emptySpecs(category), subScores: emptySubScores(category), bestFor: [] };
}

export function emptyArticle(): NewsArticle {
  return {
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    body: [""],
    kind: "launch",
    tags: [],
    productSlugs: [],
    author: "",
    publishedAt: "",
    readMinutes: 3,
    featured: false,
    status: "draft",
    sources: [],
  };
}

export function emptyGuide(category: CategorySlug = "phones"): BuyingGuide {
  return {
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    category,
    picks: [],
    body: [""],
    author: "",
    publishedAt: "",
    updatedAt: "",
    status: "draft",
  };
}

export function emptySource(id: string): Source {
  return { id, title: "", publisher: "", url: "", type: "official", accessedAt: "" };
}

/** Next free id like "s6" for a list of sources. */
export function nextSourceId(sources: Source[]): string {
  let n = sources.length + 1;
  const taken = new Set(sources.map((s) => s.id));
  while (taken.has(`s${n}`)) n++;
  return `s${n}`;
}

/** slugify + "-2", "-3"... until it doesn't collide. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  const root = slugify(base) || "untitled";
  if (!set.has(root)) return root;
  let n = 2;
  while (set.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

/** Rough reading time for an article body (≈220 words per minute). */
export function estimateReadMinutes(body: string[]): number {
  const words = body.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function productTitle(p: Pick<Product, "brand" | "name">): string {
  return [p.brand, p.name].filter(Boolean).join(" ").trim();
}
