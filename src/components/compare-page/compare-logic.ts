import { formatSpec, needScore } from "@/lib/product-utils";
import type { CategoryConfig, Product, ScoreCriterion, SpecField, SpecValue } from "@/lib/types";
import type { CompareProduct } from "./types";

/** Pure helpers for the comparison page (no React). */

export const MAX_COMPARE = 5;

/** "a,b,,c" → ["a","b","c"] (trimmed, de-duplicated). */
export function parseIds(param: string | null): string[] {
  if (!param) return [];
  const out: string[] = [];
  for (const raw of param.split(",")) {
    let slug = raw.trim();
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // keep the raw value; it simply won't match a product
    }
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

export interface ResolvedSelection {
  products: CompareProduct[];
  /** slugs that don't match a published product */
  unknown: string[];
  /** valid products dropped because they belong to another category */
  mismatched: CompareProduct[];
  /** valid products dropped because the limit of five was reached */
  overflow: CompareProduct[];
}

/**
 * Turn a list of slugs into a valid selection: known products only, all in
 * the category of the first valid product, at most five.
 */
export function resolveSelection(slugs: string[], bySlug: Map<string, CompareProduct>): ResolvedSelection {
  const res: ResolvedSelection = { products: [], unknown: [], mismatched: [], overflow: [] };
  for (const slug of slugs) {
    const p = bySlug.get(slug);
    if (!p) res.unknown.push(slug);
    else if (res.products.length && p.category !== res.products[0].category) res.mismatched.push(p);
    else if (res.products.length >= MAX_COMPARE) res.overflow.push(p);
    else res.products.push(p);
  }
  return res;
}

/** Indexes holding the best value; [] when fewer than two values or all equal. */
export function bestOf(values: number[], higherIsBetter = true): number[] {
  if (values.length < 2) return [];
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
  if (values.every((v) => v === best)) return [];
  return values.flatMap((v, i) => (v === best ? [i] : []));
}

export type Highlight = "top-score" | "lowest-price" | "best-value";

export const HIGHLIGHT_LABELS: Record<Highlight, string> = {
  "top-score": "Top score",
  "lowest-price": "Lowest price",
  "best-value": "Best value",
};

/** Summary badges per product. "Best value" follows the editorial value sub-score. */
export function highlights(products: CompareProduct[]): Highlight[][] {
  const out: Highlight[][] = products.map(() => []);
  bestOf(products.map((p) => p.score)).forEach((i) => out[i].push("top-score"));
  bestOf(products.map((p) => p.price), false).forEach((i) => out[i].push("lowest-price"));
  bestOf(products.map((p) => p.subScores.value ?? 0)).forEach((i) => out[i].push("best-value"));
  return out;
}

/* ---------------- "Best for" verdicts ---------------- */

export type VerdictStrength = "tie" | "close" | "narrow" | "clear";

export interface NeedVerdict {
  key: string;
  label: string;
  criteria: Pick<ScoreCriterion, "key" | "label">[];
  /** every product with its need score, best first */
  ranking: { product: CompareProduct; score: number }[];
  /** one product, or several on a tie */
  winners: CompareProduct[];
  runnerUp: { product: CompareProduct; score: number } | null;
  margin: number;
  strength: VerdictStrength;
  /** per-criterion lead of the winner over the runner-up, biggest lead first */
  drivers: { label: string; diff: number }[];
}

/** needScore only reads subScores, which CompareProduct carries. */
function needScoreOf(p: CompareProduct, keys: string[]) {
  return needScore({ subScores: p.subScores } as Pick<Product, "subScores"> as Product, keys);
}

function strengthOf(margin: number): VerdictStrength {
  if (margin === 0) return "tie";
  if (margin <= 2) return "close";
  if (margin <= 6) return "narrow";
  return "clear";
}

export const STRENGTH_LABELS: Record<VerdictStrength, string> = {
  tie: "Tie",
  close: "Too close to call",
  narrow: "Narrow lead",
  clear: "Clear lead",
};

/**
 * For each category need, rank the products by needScore (the average of the
 * need's criteria sub-scores) and explain which criteria decided it.
 */
export function needVerdicts(
  category: CategoryConfig,
  criteria: ScoreCriterion[],
  products: CompareProduct[],
): NeedVerdict[] {
  const labelOf = (key: string) => criteria.find((c) => c.key === key)?.label ?? key;
  return category.needs.map((need) => {
    const ranking = products
      .map((product) => ({ product, score: needScoreOf(product, need.criteria) }))
      .sort((a, b) => b.score - a.score || b.product.score - a.product.score);
    const top = ranking[0]?.score ?? 0;
    const winners = ranking.filter((r) => r.score === top).map((r) => r.product);
    const runnerUp = ranking.find((r) => r.score < top) ?? null;
    const tie = winners.length > 1;
    const margin = tie || !runnerUp ? 0 : top - runnerUp.score;
    const rival = tie ? ranking[1] : runnerUp;
    const drivers =
      rival && ranking[0]
        ? need.criteria
            .map((k) => ({
              label: labelOf(k),
              diff: (ranking[0].product.subScores[k] ?? 0) - (rival.product.subScores[k] ?? 0),
            }))
            .sort((a, b) => b.diff - a.diff)
        : [];
    return {
      key: need.key,
      label: need.label,
      criteria: need.criteria.map((k) => ({ key: k, label: labelOf(k) })),
      ranking,
      winners,
      runnerUp: tie ? null : runnerUp,
      margin,
      strength: tie ? "tie" : strengthOf(margin),
      drivers,
    };
  });
}

/* ---------------- specs ---------------- */

/** Like formatSpec, but a numeric 0 means "feature absent" (e.g. no USB-C power, no ANC). */
export function displaySpec(field: SpecField, value: SpecValue | undefined): string {
  if (typeof value === "number" && value === 0) return "None";
  return formatSpec(field, value);
}

export function allSame(values: string[]): boolean {
  return values.every((v) => v === values[0]);
}

/* ---------------- dates ---------------- */

const istDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Stored ISO datetime → "15 Nov 2026" in India time. */
export function formatCheckedAt(iso: string): string {
  return istDate.format(new Date(iso));
}

/** "2026-10-14" → "Oct 2026" without timezone conversion. */
export function formatReleaseMonth(date: string): string {
  const [y, m] = date.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""} ${y}`.trim();
}
