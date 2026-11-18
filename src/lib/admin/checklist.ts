/**
 * The research workflow checklist (add product → specs → sources → prices →
 * verify → publish). Shared by the editor UI and the save action so the
 * rules can't drift apart.
 */
import { requireCategory } from "@/lib/categories";
import type { Product } from "@/lib/types";

export type ChecklistKey = "basics" | "specs" | "scores" | "sources" | "offers" | "history" | "content" | "reviews";

export interface ChecklistItem {
  key: ChecklistKey;
  label: string;
  detail: string;
  ok: boolean;
  /** required items gate the "Verified" flag */
  required: boolean;
  /** editor tab that fixes this item */
  tab: "basics" | "specs" | "scores" | "content" | "prices" | "reviews";
}

export const MIN_SOURCES = 3;

/** Spec keys still empty (text "" or number not entered). Booleans always count as filled. */
export function missingSpecs(p: Product): string[] {
  return requireCategory(p.category)
    .specs.filter((f) => {
      const v = p.specs[f.key];
      if (f.type === "boolean") return typeof v !== "boolean";
      if (f.type === "number") return typeof v !== "number" || !Number.isFinite(v);
      return typeof v !== "string" || !v.trim();
    })
    .map((f) => f.label);
}

export function unscoredCriteria(p: Product): string[] {
  return requireCategory(p.category)
    .criteria.filter((c) => !(typeof p.subScores[c.key] === "number" && p.subScores[c.key] > 0))
    .map((c) => c.label);
}

function missingBasics(p: Product): string[] {
  const out: string[] = [];
  if (!p.brand.trim()) out.push("brand");
  if (!p.name.trim()) out.push("model name");
  if (!p.slug.trim()) out.push("URL slug");
  if (!p.releaseDate) out.push("release date");
  if (!p.tagline.trim()) out.push("tagline");
  if (!p.summary.trim()) out.push("summary");
  if (!(p.msrp > 0)) out.push("launch price");
  return out;
}

function list(items: string[], max = 3) {
  return items.length > max ? `${items.slice(0, max).join(", ")} +${items.length - max} more` : items.join(", ");
}

export function productChecklist(p: Product): ChecklistItem[] {
  const basics = missingBasics(p);
  const specs = missingSpecs(p);
  const scores = unscoredCriteria(p);
  const validOffers = p.offers.filter((o) => o.price > 0 && /^https?:\/\//.test(o.url));
  const total = requireCategory(p.category).specs.length;

  return [
    {
      key: "basics",
      label: "Basics filled in",
      detail: basics.length ? `Missing ${list(basics)}` : "Name, tagline, summary and launch price are set",
      ok: basics.length === 0,
      required: true,
      tab: "basics",
    },
    {
      key: "specs",
      label: "Specifications complete",
      detail: specs.length ? `${total - specs.length} of ${total} filled · missing ${list(specs)}` : `All ${total} specs filled`,
      ok: specs.length === 0,
      required: true,
      tab: "specs",
    },
    {
      key: "scores",
      label: "Every criterion scored",
      detail: scores.length ? `Not scored: ${list(scores)}` : "All sub-scores set",
      ok: scores.length === 0,
      required: true,
      tab: "scores",
    },
    {
      key: "sources",
      label: `At least ${MIN_SOURCES} sources`,
      detail: `${p.sources.length} source${p.sources.length === 1 ? "" : "s"} attached`,
      ok: p.sources.filter((s) => s.title.trim() && /^https?:\/\//.test(s.url)).length >= MIN_SOURCES,
      required: true,
      tab: "reviews",
    },
    {
      key: "offers",
      label: "At least one retailer price",
      detail: validOffers.length ? `${validOffers.length} offer${validOffers.length === 1 ? "" : "s"} with price and link` : "Add a retailer, price and link",
      ok: validOffers.length >= 1,
      required: true,
      tab: "prices",
    },
    {
      key: "history",
      label: "Price history started",
      detail: p.priceHistory.length ? `${p.priceHistory.length} recorded point${p.priceHistory.length === 1 ? "" : "s"}` : "Record today's price so the graph can start",
      ok: p.priceHistory.length >= 1,
      required: false,
      tab: "prices",
    },
    {
      key: "content",
      label: "Pros, cons and best-for",
      detail: `${p.pros.length} pros · ${p.cons.length} cons · ${p.bestFor.length} needs`,
      ok: p.pros.length >= 2 && p.cons.length >= 1 && p.bestFor.length >= 1,
      required: false,
      tab: "content",
    },
    {
      key: "reviews",
      label: "Expert reviews summarised",
      detail: `${p.reviews.length} review${p.reviews.length === 1 ? "" : "s"}`,
      ok: p.reviews.length >= 1,
      required: false,
      tab: "reviews",
    },
  ];
}

export function canVerify(items: ChecklistItem[]): boolean {
  return items.every((i) => !i.required || i.ok);
}

/** Minimum to go live without breaking public pages (verification is separate). */
export function publishBlockers(items: ChecklistItem[]): string[] {
  return items.filter((i) => ["basics", "specs", "scores", "offers"].includes(i.key) && !i.ok).map((i) => i.label);
}
