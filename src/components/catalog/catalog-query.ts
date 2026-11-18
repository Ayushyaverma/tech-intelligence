/**
 * Category listing state: the filter/sort "query", how it maps to the URL,
 * and the pure filtering, faceting and sorting functions that use it.
 * No React here, so it is safe for both server and client code.
 *
 * URL format (shareable): /category/phones?q=aster&tier=flagship&brand=Aster&brand=Kairo
 *   &price=20000-60000&processor=Nexis%207%20Gen%204&ram=8&wireless=1&sort=price-asc&view=list
 * Spec filters use the spec key from the category config as the parameter name.
 */
import { formatSpec, specField } from "@/lib/product-utils";
import type { CategoryConfig, FilterDef, Product, SpecValue, Tier } from "@/lib/types";
import { formatINRCompact } from "@/lib/format";

/* ---------------------------------------------------------------- types */

/** One product as the listing sees it. Built on the server (see listing.ts). */
export interface CatalogEntry {
  /** trimmed copy of the product — enough for ProductCard, not the full record */
  product: Product;
  /** platform score /100, computed on the server with the site's weight overrides */
  score: number;
  /** current best price, INR */
  price: number;
  /** lower-cased text that the in-category search matches against */
  haystack: string;
}

export type SortKey = "recommended" | "price-asc" | "price-desc" | "score" | "popular" | "newest";
export type ViewMode = "grid" | "list";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "score", label: "Highest score" },
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
];

/** "phones", "laptops", "TVs" … for running text. */
export function pluralNoun(category: CategoryConfig): string {
  const n = category.shortName;
  return n === n.toUpperCase().slice(0, n.length - 1) + n.slice(-1) ? n : n.toLowerCase();
}

export const TIER_ORDER: Tier[] = ["flagship", "upper-mid", "mid-range", "budget"];

export interface CatalogQuery {
  q: string;
  tier: Tier | null;
  sort: SortKey;
  view: ViewMode;
  priceMin: number | null;
  priceMax: number | null;
  brands: string[];
  /** spec key → accepted values (stringified) for "options" filters */
  options: Record<string, string[]>;
  /** spec key → minimum value for "min" filters */
  mins: Record<string, number>;
  /** spec keys of "boolean" filters that must be true */
  flags: string[];
}

export const DEFAULT_QUERY: CatalogQuery = {
  q: "",
  tier: null,
  sort: "recommended",
  view: "grid",
  priceMin: null,
  priceMax: null,
  brands: [],
  options: {},
  mins: {},
  flags: [],
};

/* ---------------------------------------------------------------- URL */

const isSort = (v: string | null): v is SortKey => SORT_OPTIONS.some((o) => o.value === v);
const isTier = (v: string | null): v is Tier => TIER_ORDER.includes(v as Tier);

function positiveInt(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function parseQuery(params: URLSearchParams, category: CategoryConfig): CatalogQuery {
  const query: CatalogQuery = {
    ...DEFAULT_QUERY,
    // not trimmed: the search box writes as you type, and "aster " must round-trip unchanged
    q: (params.get("q") ?? "").slice(0, 80),
    tier: isTier(params.get("tier")) ? (params.get("tier") as Tier) : null,
    sort: isSort(params.get("sort")) ? (params.get("sort") as SortKey) : "recommended",
    view: params.get("view") === "list" ? "list" : "grid",
    options: {},
    mins: {},
    flags: [],
  };

  const [lo, hi] = (params.get("price") ?? "").split("-");
  query.priceMin = positiveInt(lo);
  query.priceMax = positiveInt(hi);
  if (query.priceMin !== null && query.priceMax !== null && query.priceMin > query.priceMax) {
    [query.priceMin, query.priceMax] = [query.priceMax, query.priceMin];
  }

  for (const f of category.filters) {
    if (f.kind === "brand") query.brands = unique(params.getAll("brand"));
    else if (f.kind === "options") {
      const values = unique(params.getAll(f.key));
      if (values.length) query.options[f.key] = values;
    } else if (f.kind === "min") {
      const n = Number(params.get(f.key));
      if (Number.isFinite(n) && n > 0) query.mins[f.key] = n;
    } else if (f.kind === "boolean") {
      const v = params.get(f.key);
      if (v === "1" || v === "true") query.flags.push(f.key);
    }
  }
  return query;
}

/** Stable, minimal query string (defaults are omitted). */
export function serializeQuery(query: CatalogQuery, category: CategoryConfig): string {
  const p = new URLSearchParams();
  if (query.q.trim()) p.set("q", query.q);
  if (query.tier) p.set("tier", query.tier);
  for (const f of category.filters) {
    if (f.kind === "price" && (query.priceMin !== null || query.priceMax !== null)) {
      p.set("price", `${query.priceMin ?? ""}-${query.priceMax ?? ""}`);
    } else if (f.kind === "brand") query.brands.forEach((b) => p.append("brand", b));
    else if (f.kind === "options") (query.options[f.key] ?? []).forEach((v) => p.append(f.key, v));
    else if (f.kind === "min" && query.mins[f.key] !== undefined) p.set(f.key, String(query.mins[f.key]));
    else if (f.kind === "boolean" && query.flags.includes(f.key)) p.set(f.key, "1");
  }
  if (query.sort !== "recommended") p.set("sort", query.sort);
  if (query.view !== "grid") p.set("view", query.view);
  return p.toString();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

/* ---------------------------------------------------------------- filtering */

/** Which facet to ignore when computing counts for that facet itself. */
type Skip = "q" | "tier" | "price" | "brand" | (string & {});

function matches(entry: CatalogEntry, query: CatalogQuery, category: CategoryConfig, skip?: Skip): boolean {
  const { product, price } = entry;
  if (skip !== "q" && query.q.trim()) {
    const tokens = query.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.every((t) => entry.haystack.includes(t))) return false;
  }
  if (skip !== "tier" && query.tier && product.tier !== query.tier) return false;
  if (skip !== "price") {
    if (query.priceMin !== null && price < query.priceMin) return false;
    if (query.priceMax !== null && price > query.priceMax) return false;
  }
  if (skip !== "brand" && query.brands.length && !query.brands.includes(product.brand)) return false;

  for (const f of category.filters) {
    if (f.key === skip) continue;
    const value = product.specs[f.key];
    if (f.kind === "options") {
      const accepted = query.options[f.key];
      if (accepted?.length && !accepted.includes(String(value))) return false;
    } else if (f.kind === "min") {
      const min = query.mins[f.key];
      if (min !== undefined && !(typeof value === "number" && value >= min)) return false;
    } else if (f.kind === "boolean") {
      if (query.flags.includes(f.key) && value !== true) return false;
    }
  }
  return true;
}

export function filterEntries(entries: CatalogEntry[], query: CatalogQuery, category: CategoryConfig) {
  return entries.filter((e) => matches(e, query, category));
}

/** "Recommended" blends quality and popularity so strong, well-known picks rise. */
function recommendedRank(e: CatalogEntry) {
  return e.score * 0.7 + e.product.popularity * 0.3;
}

export function sortEntries(entries: CatalogEntry[], sort: SortKey): CatalogEntry[] {
  const list = [...entries];
  const by: Record<SortKey, (a: CatalogEntry, b: CatalogEntry) => number> = {
    recommended: (a, b) => recommendedRank(b) - recommendedRank(a),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    score: (a, b) => b.score - a.score,
    popular: (a, b) => b.product.popularity - a.product.popularity,
    newest: (a, b) => b.product.releaseDate.localeCompare(a.product.releaseDate),
  };
  // Ties fall back to score, then name, so the order never jitters.
  return list.sort((a, b) => by[sort](a, b) || b.score - a.score || a.product.name.localeCompare(b.product.name));
}

/* ---------------------------------------------------------------- facets */

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  tiers: Record<Tier, number>;
  /** products in the tier pool ("All" chip) */
  tierTotal: number;
  brands: FacetOption[];
  options: Record<string, FacetOption[]>;
  /** spec key → step → count */
  mins: Record<string, Record<number, number>>;
  /** spec key → products with the feature */
  flags: Record<string, number>;
  /** products that pass every filter except price (for the price histogram) */
  pricePool: number[];
}

function compareValues(a: SpecValue, b: SpecValue) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en", { numeric: true });
}

/**
 * Counts for every filter option. Each facet is counted against the products
 * that pass all the *other* filters, so the numbers show what a click would give.
 */
export function computeFacets(entries: CatalogEntry[], query: CatalogQuery, category: CategoryConfig): Facets {
  const pool = (skip: Skip) => entries.filter((e) => matches(e, query, category, skip));

  const tierPool = pool("tier");
  const tiers = Object.fromEntries(TIER_ORDER.map((t) => [t, 0])) as Record<Tier, number>;
  tierPool.forEach((e) => tiers[e.product.tier]++);

  const facets: Facets = {
    tiers,
    tierTotal: tierPool.length,
    brands: [],
    options: {},
    mins: {},
    flags: {},
    pricePool: pool("price").map((e) => e.price),
  };

  for (const f of category.filters) {
    if (f.kind === "price") continue;
    const scoped = pool(f.kind === "brand" ? "brand" : f.key);

    if (f.kind === "brand") {
      const names = [...new Set(entries.map((e) => e.product.brand))].sort();
      facets.brands = names.map((name) => ({
        value: name,
        label: name,
        count: scoped.filter((e) => e.product.brand === name).length,
      }));
    } else if (f.kind === "options") {
      const field = specField(category, f.key);
      const raw = [...new Map(entries.map((e) => [String(e.product.specs[f.key]), e.product.specs[f.key]])).values()]
        .filter((v) => v !== undefined && v !== "")
        .sort(compareValues);
      facets.options[f.key] = raw.map((v) => ({
        value: String(v),
        label: formatSpec(field, v),
        count: scoped.filter((e) => String(e.product.specs[f.key]) === String(v)).length,
      }));
    } else if (f.kind === "min") {
      facets.mins[f.key] = Object.fromEntries(
        f.steps.map((step) => [
          step,
          scoped.filter((e) => {
            const v = e.product.specs[f.key];
            return typeof v === "number" && v >= step;
          }).length,
        ]),
      );
    } else if (f.kind === "boolean") {
      facets.flags[f.key] = scoped.filter((e) => e.product.specs[f.key] === true).length;
    }
  }
  return facets;
}

/* ---------------------------------------------------------------- active filters */

/** Number of sidebar filters in use (search, tier, sort and view are not counted). */
export function countFilters(query: CatalogQuery): number {
  return (
    (query.priceMin !== null || query.priceMax !== null ? 1 : 0) +
    query.brands.length +
    Object.values(query.options).reduce((n, v) => n + v.length, 0) +
    Object.keys(query.mins).length +
    query.flags.length
  );
}

/** Remove every filter but keep sort/view (and optionally search + tier). */
export function clearFilters(query: CatalogQuery, keepSearchAndTier = false): CatalogQuery {
  return {
    ...DEFAULT_QUERY,
    sort: query.sort,
    view: query.view,
    ...(keepSearchAndTier ? { q: query.q, tier: query.tier } : {}),
  };
}

export function priceLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${formatINRCompact(min)} – ${formatINRCompact(max)}`;
  if (max !== null) return `Under ${formatINRCompact(max)}`;
  if (min !== null) return `${formatINRCompact(min)}+`;
  return "Any price";
}

/** "8 GB+", "4,500 mAh+", "1 TB+" */
export function minStepLabel(category: CategoryConfig, key: string, step: number) {
  return `${formatSpec(specField(category, key), step)}+`;
}

export interface ActivePill {
  id: string;
  label: string;
  remove: (q: CatalogQuery) => CatalogQuery;
}

export function activePills(query: CatalogQuery, category: CategoryConfig, tierLabels: Record<Tier, string>): ActivePill[] {
  const pills: ActivePill[] = [];
  if (query.q.trim()) pills.push({ id: "q", label: `“${query.q.trim()}”`, remove: (q) => ({ ...q, q: "" }) });
  if (query.tier) {
    pills.push({ id: "tier", label: tierLabels[query.tier], remove: (q) => ({ ...q, tier: null }) });
  }
  for (const f of category.filters) pills.push(...pillsFor(f, query, category));
  return pills;
}

function pillsFor(f: FilterDef, query: CatalogQuery, category: CategoryConfig): ActivePill[] {
  switch (f.kind) {
    case "price":
      return query.priceMin !== null || query.priceMax !== null
        ? [{ id: "price", label: priceLabel(query.priceMin, query.priceMax), remove: (q) => ({ ...q, priceMin: null, priceMax: null }) }]
        : [];
    case "brand":
      return query.brands.map((b) => ({
        id: `brand:${b}`,
        label: b,
        remove: (q) => ({ ...q, brands: q.brands.filter((x) => x !== b) }),
      }));
    case "options": {
      const field = specField(category, f.key);
      return (query.options[f.key] ?? []).map((v) => ({
        id: `${f.key}:${v}`,
        label: `${f.label}: ${field?.type === "number" ? formatSpec(field, Number(v)) : v}`,
        remove: (q) => ({ ...q, options: withValues(q.options, f.key, (q.options[f.key] ?? []).filter((x) => x !== v)) }),
      }));
    }
    case "min":
      return query.mins[f.key] !== undefined
        ? [{
            id: f.key,
            label: `${f.label} ${minStepLabel(category, f.key, query.mins[f.key])}`,
            remove: (q) => ({ ...q, mins: omit(q.mins, f.key) }),
          }]
        : [];
    case "boolean":
      return query.flags.includes(f.key)
        ? [{ id: f.key, label: f.label, remove: (q) => ({ ...q, flags: q.flags.filter((k) => k !== f.key) }) }]
        : [];
  }
}

/* ---------------------------------------------------------------- small immutable helpers */

export function withValues(map: Record<string, string[]>, key: string, values: string[]) {
  const next = { ...map };
  if (values.length) next[key] = values;
  else delete next[key];
  return next;
}

export function omit<T>(map: Record<string, T>, key: string): Record<string, T> {
  const next = { ...map };
  delete next[key];
  return next;
}

export function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/* ---------------------------------------------------------------- price helpers */

const NICE_PRICES = [
  2_000, 5_000, 10_000, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000, 60_000, 75_000, 1_00_000, 1_25_000,
  1_50_000, 2_00_000, 2_50_000, 3_00_000, 4_00_000, 5_00_000,
];

/** Slider bounds rounded outward to a sensible step. */
export function priceBounds(prices: number[]) {
  if (!prices.length) return { min: 0, max: 0, step: 1 };
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const step = hi - lo > 1_00_000 ? 1_000 : hi - lo > 20_000 ? 500 : 100;
  return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step };
}

export interface BudgetBucket {
  label: string;
  min: number | null;
  max: number | null;
}

/** Three quick budget chips ("Under ₹25K", "₹25K – ₹60K", "₹60K+") fitted to this category's prices. */
export function budgetBuckets(prices: number[]): BudgetBucket[] {
  if (prices.length < 3) return [];
  const sorted = [...prices].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const nice = (v: number) => NICE_PRICES.find((n) => n >= v) ?? v;
  const t1 = nice(at(0.34));
  const t2 = nice(at(0.67));
  if (t1 >= sorted[sorted.length - 1]) return [];
  const buckets: BudgetBucket[] = [{ label: priceLabel(null, t1), min: null, max: t1 }];
  if (t2 > t1 && t2 < sorted[sorted.length - 1]) {
    buckets.push({ label: priceLabel(t1, t2), min: t1, max: t2 });
    buckets.push({ label: priceLabel(t2, null), min: t2, max: null });
  } else {
    buckets.push({ label: priceLabel(t1, null), min: t1, max: null });
  }
  return buckets;
}
