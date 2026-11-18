/**
 * Validates the JSON files in /data against the data contract and category
 * templates. Run with `npm run validate:data` after editing data by hand.
 * Exits with code 1 if any error is found (warnings do not fail the run).
 */
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, getCategory } from "../src/lib/categories";
import { computeScore, currentPrice, priceChange } from "../src/lib/product-utils";
import type {
  AdSlotId,
  BuyingGuide,
  CategorySlug,
  NewsArticle,
  Product,
  SiteSettings,
  TrendingComparison,
} from "../src/lib/types";

const AD_SLOT_IDS = [
  "home-between-news",
  "category-between-listings",
  "product-below-specs",
  "guides-articles",
  "compare-below-results",
] as const satisfies readonly AdSlotId[];
// Compile-time guard: fails type-checking if AdSlotId gains an id missing above.
type MissingAdSlot = Exclude<AdSlotId, (typeof AD_SLOT_IDS)[number]>;
const adSlotsComplete: MissingAdSlot extends never ? true : false = true;
void adSlotsComplete;

const TIERS = new Set(["flagship", "upper-mid", "mid-range", "budget"]);
const SCORE_TYPES = new Set(["editorial", "aggregate", "benchmark"]);
const STATUSES = new Set(["published", "draft", "archived"]);
const NEWS_KINDS = new Set(["launch", "price", "industry", "review"]);
const SOURCE_TYPES = new Set(["official", "review", "benchmark", "retailer", "user"]);

const DATA_DIR = path.join(process.cwd(), "data");
const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

function read<T>(name: string): T {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch (e) {
    console.error(`Cannot read ${file}: ${(e as Error).message}`);
    process.exit(1);
  }
}

const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isDateTime = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s));
const isHex = (s: unknown) => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);

function checkUnique(items: { id: string; slug?: string }[], label: string) {
  for (const key of ["id", "slug"] as const) {
    const seen = new Set<string>();
    for (const item of items) {
      const v = item[key];
      if (v === undefined) continue;
      if (seen.has(v)) err(label, `duplicate ${key} "${v}"`);
      seen.add(v);
    }
  }
}

/* ------------------------------ products ------------------------------ */

const settings = read<SiteSettings>("settings");
const products = read<Product[]>("products");
checkUnique(products, "products");
const bySlug = new Map(products.map((p) => [p.slug, p]));

for (const p of products) {
  const where = `product ${p.slug ?? p.id}`;
  const cat = getCategory(p.category);
  if (!cat) {
    err(where, `unknown category "${p.category}"`);
    continue;
  }
  if (!p.id || !p.slug || !p.brand || !p.name) err(where, "missing id/slug/brand/name");
  if (!TIERS.has(p.tier)) err(where, `invalid tier "${p.tier}"`);
  if (!STATUSES.has(p.status)) err(where, `invalid status "${p.status}"`);
  if (!SCORE_TYPES.has(p.scoreType)) err(where, `invalid scoreType "${p.scoreType}"`);
  if (!isDate(p.releaseDate)) err(where, `invalid releaseDate "${p.releaseDate}"`);
  if (!isDateTime(p.updatedAt)) err(where, `invalid updatedAt "${p.updatedAt}"`);
  if (!isHex(p.art?.primary) || !isHex(p.art?.accent)) err(where, "art.primary/accent must be #rrggbb");
  if (!p.colors?.length || p.colors.some((c) => !c.name || !isHex(c.hex))) err(where, "colors must be non-empty {name, hex}");
  if (!(p.msrp > 0)) err(where, "msrp must be > 0");
  if (typeof p.popularity !== "number" || p.popularity < 0 || p.popularity > 100) err(where, "popularity must be 0-100");

  // specs: every key present, correct type, nothing unknown
  for (const field of cat.specs) {
    const v = p.specs?.[field.key];
    const expected = field.type === "text" ? "string" : field.type;
    if (v === undefined) err(where, `missing spec "${field.key}"`);
    else if (typeof v !== expected) err(where, `spec "${field.key}" should be ${field.type}, got ${typeof v}`);
    else if (typeof v === "number" && !Number.isFinite(v)) err(where, `spec "${field.key}" is not a finite number`);
  }
  const known = new Set(cat.specs.map((s) => s.key));
  for (const key of Object.keys(p.specs ?? {})) if (!known.has(key)) err(where, `unknown spec "${key}"`);

  // scores
  for (const c of cat.criteria) {
    const v = p.subScores?.[c.key];
    if (typeof v !== "number" || v < 0 || v > 100) err(where, `subScore "${c.key}" must be a number 0-100`);
  }
  const criteriaKeys = new Set(cat.criteria.map((c) => c.key));
  for (const key of Object.keys(p.subScores ?? {})) if (!criteriaKeys.has(key)) err(where, `unknown subScore "${key}"`);

  const needKeys = new Set(cat.needs.map((n) => n.key));
  for (const key of p.bestFor ?? []) if (!needKeys.has(key)) err(where, `unknown bestFor "${key}"`);

  // prices
  if (!p.offers?.length) err(where, "no retailer offers");
  for (const o of p.offers ?? []) {
    if (!o.retailer || !(o.price > 0) || !o.url) err(where, `offer from "${o.retailer}" needs retailer, price > 0 and url`);
    if (!isDateTime(o.checkedAt)) err(where, `offer "${o.retailer}" has invalid checkedAt`);
  }
  if (!p.priceHistory?.length) err(where, "empty priceHistory");
  let prev = "";
  for (const pt of p.priceHistory ?? []) {
    if (!isDate(pt.date)) err(where, `invalid price date "${pt.date}"`);
    if (!(pt.price > 0)) err(where, `price on ${pt.date} must be > 0`);
    if (prev && pt.date <= prev) err(where, `priceHistory not strictly ascending at ${pt.date}`);
    prev = pt.date;
  }
  const last = p.priceHistory?.at(-1);
  if (last && p.offers?.length) {
    const gap = Math.abs(currentPrice(p) - last.price) / last.price;
    if (gap > 0.05) warn(where, `current price ${currentPrice(p)} is ${Math.round(gap * 100)}% away from last history point ${last.price}`);
  }

  // editorial
  if ((p.pros?.length ?? 0) < 1 || (p.cons?.length ?? 0) < 1) err(where, "needs at least one pro and one con");
  for (const r of p.reviews ?? []) if (!r.publisher || !r.url || !isDate(r.date)) err(where, `review "${r.publisher}" needs publisher, url and date`);
  const sourceIds = new Set<string>();
  for (const s of p.sources ?? []) {
    if (sourceIds.has(s.id)) err(where, `duplicate source id "${s.id}"`);
    sourceIds.add(s.id);
    if (!SOURCE_TYPES.has(s.type)) err(where, `source "${s.id}" has invalid type "${s.type}"`);
    if (!isDate(s.accessedAt)) err(where, `source "${s.id}" has invalid accessedAt`);
  }
  if (!p.sources?.length) warn(where, "no sources");
}

/** A referenced product must exist; published content should only point at published products. */
function checkRef(where: string, slug: string, contentPublished: boolean, category?: CategorySlug) {
  const p = bySlug.get(slug);
  if (!p) return err(where, `unknown product slug "${slug}"`);
  if (category && p.category !== category) err(where, `"${slug}" is a ${p.category} product, expected ${category}`);
  if (contentPublished && p.status !== "published") err(where, `published content references ${p.status} product "${slug}"`);
}

/* -------------------------------- news -------------------------------- */

const news = read<NewsArticle[]>("news");
checkUnique(news, "news");
for (const a of news) {
  const where = `news ${a.slug}`;
  if (!NEWS_KINDS.has(a.kind)) err(where, `invalid kind "${a.kind}"`);
  if (!STATUSES.has(a.status)) err(where, `invalid status "${a.status}"`);
  if (!isDateTime(a.publishedAt)) err(where, "invalid publishedAt");
  if (a.category && !getCategory(a.category)) err(where, `unknown category "${a.category}"`);
  if (!a.body?.length) err(where, "empty body");
  for (const slug of a.productSlugs ?? []) checkRef(where, slug, a.status === "published");
}

/* ------------------------------- guides ------------------------------- */

const guides = read<BuyingGuide[]>("guides");
checkUnique(guides, "guides");
for (const g of guides) {
  const where = `guide ${g.slug}`;
  if (!getCategory(g.category)) err(where, `unknown category "${g.category}"`);
  if (!STATUSES.has(g.status)) err(where, `invalid status "${g.status}"`);
  if (!isDateTime(g.publishedAt) || !isDateTime(g.updatedAt)) err(where, "invalid publishedAt/updatedAt");
  if (!g.picks?.length) err(where, "no picks");
  for (const pick of g.picks ?? []) {
    checkRef(where, pick.productSlug, g.status === "published", g.category);
    const p = bySlug.get(pick.productSlug);
    if (p && g.budgetMax && currentPrice(p) > g.budgetMax) warn(where, `"${p.slug}" costs ${currentPrice(p)}, above budget ${g.budgetMax}`);
  }
}

/* ----------------------------- comparisons ---------------------------- */

const comparisons = read<TrendingComparison[]>("comparisons");
checkUnique(comparisons, "comparisons");
for (const c of comparisons) {
  const where = `comparison ${c.id}`;
  if (c.productSlugs.length < 2 || c.productSlugs.length > 5) err(where, "needs 2-5 products");
  for (const slug of c.productSlugs) checkRef(where, slug, true, c.category);
}

/* ------------------------------ settings ------------------------------ */

const validSlots = new Set<string>(AD_SLOT_IDS);
const seenSlots = new Set<string>();
for (const slot of settings.adSlots ?? []) {
  if (!validSlots.has(slot.id)) err("settings", `unknown ad slot id "${slot.id}"`);
  if (seenSlots.has(slot.id)) err("settings", `duplicate ad slot "${slot.id}"`);
  seenSlots.add(slot.id);
}
for (const id of AD_SLOT_IDS) if (!seenSlots.has(id)) err("settings", `missing ad slot "${id}"`);
for (const [slug, weights] of Object.entries(settings.weightOverrides ?? {})) {
  const cat = getCategory(slug);
  if (!cat) err("settings", `weightOverrides for unknown category "${slug}"`);
  else for (const key of Object.keys(weights ?? {})) if (!cat.criteria.some((c) => c.key === key)) err("settings", `weightOverrides.${slug} has unknown criterion "${key}"`);
}

/* ------------------------------- summary ------------------------------ */

const live = products.filter((p) => p.status === "published");
const scores = live.map((p) => computeScore(p, settings));
const drops = live.filter((p) => priceChange(p, 30).percent <= -1).length;
const rises = live.filter((p) => priceChange(p, 30).percent >= 1).length;

console.log("Tech Intelligence data check");
for (const cat of CATEGORIES) {
  const inCat = products.filter((p) => p.category === cat.slug);
  const brands = [...new Set(inCat.map((p) => p.brand))].join(", ");
  console.log(`  ${cat.shortName.padEnd(11)} ${inCat.length} products (${inCat.filter((p) => p.status === "published").length} published) · ${brands}`);
}
console.log(`  Products    ${products.length} total · scores ${Math.min(...scores)}–${Math.max(...scores)} · 30-day drops ${drops}, rises ${rises}`);
console.log(`  Content     ${news.length} news · ${guides.length} guides · ${comparisons.length} comparisons · ${settings.adSlots.length} ad slots (${settings.adSlots.filter((s) => s.enabled).length} enabled)`);
for (const w of warnings) console.log(`  warning  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  error    ${e}`);
  console.error(`\n${errors.length} error(s) found.`);
  process.exit(1);
}
console.log(`\nAll checks passed${warnings.length ? ` with ${warnings.length} warning(s)` : ""}.`);
