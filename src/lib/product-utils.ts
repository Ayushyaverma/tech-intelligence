import { requireCategory } from "./categories";
import type {
  CategoryConfig,
  Product,
  ScoreCriterion,
  SiteSettings,
  SpecField,
  SpecValue,
} from "./types";

/** Pure helpers — safe to import from client and server components. */

/** Criteria with any admin weight overrides applied. Weights always re-normalise to 100. */
export function effectiveCriteria(
  category: CategoryConfig,
  settings?: Pick<SiteSettings, "weightOverrides"> | null,
): ScoreCriterion[] {
  const overrides = settings?.weightOverrides?.[category.slug];
  const raw = category.criteria.map((c) => ({ ...c, weight: overrides?.[c.key] ?? c.weight }));
  const total = raw.reduce((s, c) => s + c.weight, 0) || 1;
  return raw.map((c) => ({ ...c, weight: Math.round((c.weight / total) * 1000) / 10 }));
}

/** Weighted platform score out of 100 (integer). */
export function computeScore(
  product: Product,
  settings?: Pick<SiteSettings, "weightOverrides"> | null,
): number {
  const criteria = effectiveCriteria(requireCategory(product.category), settings);
  let sum = 0;
  let weight = 0;
  for (const c of criteria) {
    const v = product.subScores[c.key];
    if (typeof v === "number") {
      sum += v * c.weight;
      weight += c.weight;
    }
  }
  return weight ? Math.round(sum / weight) : 0;
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very good";
  if (score >= 60) return "Good";
  return "Average";
}

/** Tone keyword for colouring a score badge. */
export function scoreTone(score: number): "great" | "good" | "ok" | "low" {
  if (score >= 85) return "great";
  if (score >= 75) return "good";
  if (score >= 65) return "ok";
  return "low";
}

/** Lowest in-stock offer, falling back to the latest history point, then MSRP. */
export function currentPrice(product: Product): number {
  const inStock = product.offers.filter((o) => o.inStock);
  const pool = inStock.length ? inStock : product.offers;
  if (pool.length) return Math.min(...pool.map((o) => o.price));
  const last = product.priceHistory.at(-1);
  return last ? last.price : product.msrp;
}

export function bestOffer(product: Product) {
  const inStock = product.offers.filter((o) => o.inStock);
  const pool = inStock.length ? inStock : product.offers;
  return [...pool].sort((a, b) => a.price - b.price)[0];
}

/** Most recent time any offer was verified (ISO string) */
export function lastChecked(product: Product): string | undefined {
  return product.offers.map((o) => o.checkedAt).sort().at(-1);
}

export function lowestEver(product: Product): number {
  const prices = product.priceHistory.map((p) => p.price);
  return prices.length ? Math.min(...prices, currentPrice(product)) : currentPrice(product);
}

/**
 * Price change between the current price and the recorded price `days`
 * before the latest history point. Uses recorded data only.
 */
export function priceChange(product: Product, days = 30): { amount: number; percent: number } {
  const hist = product.priceHistory;
  const now = currentPrice(product);
  if (hist.length < 2) return { amount: 0, percent: 0 };
  const latest = new Date(hist[hist.length - 1].date).getTime();
  const cutoff = latest - days * 86_400_000;
  let ref = hist[0];
  for (const p of hist) {
    if (new Date(p.date).getTime() <= cutoff) ref = p;
  }
  const amount = now - ref.price;
  return { amount, percent: ref.price ? Math.round((amount / ref.price) * 1000) / 10 : 0 };
}

export type Trend = "down" | "up" | "flat";
export function priceTrend(product: Product, days = 30): Trend {
  const { percent } = priceChange(product, days);
  if (percent <= -1) return "down";
  if (percent >= 1) return "up";
  return "flat";
}

/** Format a spec value with its unit. */
export function formatSpec(field: SpecField | undefined, value: SpecValue | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (field?.key === "storage" && value >= 1024) return `${value / 1024} TB`;
    const n = Number.isInteger(value) ? value.toLocaleString("en-IN") : String(value);
    return field?.unit ? `${n} ${field.unit}` : n;
  }
  return value;
}

export function specField(category: CategoryConfig, key: string): SpecField | undefined {
  return category.specs.find((s) => s.key === key);
}

/**
 * For a numeric spec across several products, which product indexes hold the
 * best value? Returns [] when not comparable or all equal.
 */
export function bestIndexes(field: SpecField, values: (SpecValue | undefined)[]): number[] {
  if (field.type === "boolean") {
    const yes = values.map((v, i) => (v === true ? i : -1)).filter((i) => i >= 0);
    return yes.length && yes.length < values.length ? yes : [];
  }
  if (field.type !== "number" || field.higherIsBetter === undefined) return [];
  const nums = values.map((v) => (typeof v === "number" ? v : NaN));
  const valid = nums.filter((n) => !Number.isNaN(n));
  if (valid.length < 2) return [];
  const best = field.higherIsBetter ? Math.max(...valid) : Math.min(...valid);
  if (valid.every((n) => n === best)) return [];
  return nums.map((n, i) => (n === best ? i : -1)).filter((i) => i >= 0);
}

/** Score for a "need" (average of the relevant sub-scores). */
export function needScore(product: Product, criteriaKeys: string[]): number {
  const vals = criteriaKeys.map((k) => product.subScores[k]).filter((v): v is number => typeof v === "number");
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

export function isPublished(p: { status: string }) {
  return p.status === "published";
}

export function productHref(p: Pick<Product, "slug">) {
  return `/product/${p.slug}`;
}

export function compareHref(slugs: string[]) {
  return `/compare?ids=${slugs.map(encodeURIComponent).join(",")}`;
}
