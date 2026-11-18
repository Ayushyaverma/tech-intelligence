/**
 * Input validation for admin saves. Everything coming from the browser is
 * untrusted: these functions rebuild clean records field by field (unknown
 * keys are dropped, types coerced, lengths capped) or return a readable error.
 */
import { getCategory, isCategorySlug, requireCategory } from "@/lib/categories";
import type {
  AdSlot,
  Benchmark,
  BuyingGuide,
  CategorySlug,
  ExpertReview,
  GuidePick,
  NewsArticle,
  NewsKind,
  PricePoint,
  Product,
  PublishStatus,
  RetailerOffer,
  ScoreType,
  Source,
  SourceType,
  SpecValue,
  Tier,
  UserFeedback,
} from "@/lib/types";

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

class InvalidInput extends Error {}

/* ---------- primitive coercion ---------- */

type Obj = Record<string, unknown>;

function obj(v: unknown, what: string): Obj {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new InvalidInput(`${what} is malformed.`);
  return v as Obj;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "";
}

/** Multi-line text keeps inner newlines but trims the ends. */
function text(v: unknown, max = 8000): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function int(v: unknown, min: number, max: number, fallback = min): number {
  return Math.min(max, Math.max(min, Math.round(num(v, fallback))));
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "on";
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function date(v: unknown): string {
  const s = str(v, 10);
  return DATE_RE.test(s) && !Number.isNaN(Date.parse(s)) ? s : "";
}

function isoDateTime(v: unknown): string {
  const s = str(v, 40);
  const t = Date.parse(s);
  return s && !Number.isNaN(t) ? new Date(t).toISOString() : "";
}

function url(v: unknown): string {
  const s = str(v, 2000);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

const HEX_RE = /^#[0-9a-f]{6}$/i;
function hex(v: unknown, fallback: string): string {
  const s = str(v, 7);
  return HEX_RE.test(s) ? s.toLowerCase() : fallback;
}

function slug(v: unknown): string {
  const s = str(v, 120).toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) ? s : "";
}

function strings(v: unknown, maxItems: number, maxLen = 300): string[] {
  return arr(v)
    .map((x) => str(x, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

const STATUSES: readonly PublishStatus[] = ["draft", "published", "archived"];
const TIERS: readonly Tier[] = ["flagship", "upper-mid", "mid-range", "budget"];
const SCORE_TYPES: readonly ScoreType[] = ["editorial", "aggregate", "benchmark"];
const SOURCE_TYPES: readonly SourceType[] = ["official", "review", "benchmark", "retailer", "user"];
const NEWS_KINDS: readonly NewsKind[] = ["launch", "price", "industry", "review"];

/* ---------- shared pieces ---------- */

function sources(v: unknown): Source[] {
  const seen = new Set<string>();
  return arr(v)
    .slice(0, 30)
    .map((raw, i) => {
      const s = obj(raw, "A source");
      let id = str(s.id, 40) || `s${i + 1}`;
      while (seen.has(id)) id = `${id}-${i + 1}`;
      seen.add(id);
      return {
        id,
        title: str(s.title, 200),
        publisher: str(s.publisher, 120),
        url: url(s.url),
        type: oneOf(s.type, SOURCE_TYPES, "official"),
        accessedAt: date(s.accessedAt),
      };
    })
    .filter((s) => s.title || s.url);
}

function requireSourcesValid(list: Source[]) {
  for (const s of list) {
    if (!s.title) throw new InvalidInput("Every source needs a title.");
    if (!s.url) throw new InvalidInput(`Source "${s.title}" needs a valid http(s) link.`);
    if (!s.accessedAt) throw new InvalidInput(`Source "${s.title}" needs the date it was checked.`);
  }
}

/* ---------- products ---------- */

function specs(v: unknown, category: CategorySlug): Record<string, SpecValue> {
  const raw = v && typeof v === "object" ? (v as Obj) : {};
  const out: Record<string, SpecValue> = {};
  for (const f of requireCategory(category).specs) {
    const val = raw[f.key];
    // Unfilled numbers are stored as 0, the convention for "not applicable".
    out[f.key] = f.type === "boolean" ? bool(val) : f.type === "number" ? num(val, 0) : str(val, 200);
  }
  return out;
}

function offers(v: unknown): RetailerOffer[] {
  return arr(v)
    .slice(0, 12)
    .map((raw) => {
      const o = obj(raw, "An offer");
      const retailer = str(o.retailer, 60);
      if (!retailer) throw new InvalidInput("Every retailer offer needs a retailer name.");
      const price = int(o.price, 0, 100_000_000);
      if (price <= 0) throw new InvalidInput(`The ${retailer} offer needs a price above ₹0.`);
      const link = url(o.url);
      if (!link) throw new InvalidInput(`The ${retailer} offer needs a valid http(s) link.`);
      const checkedAt = isoDateTime(o.checkedAt);
      if (!checkedAt) throw new InvalidInput(`The ${retailer} offer needs a "checked at" date and time.`);
      return { retailer, price, url: link, inStock: bool(o.inStock), checkedAt, affiliate: bool(o.affiliate) };
    });
}

/** Sorted oldest → newest with one point per date (the latest entry for a date wins). */
export function normaliseHistory(points: PricePoint[]): PricePoint[] {
  const byDate = new Map<string, PricePoint>();
  for (const p of points) byDate.set(p.date, p);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function history(v: unknown): PricePoint[] {
  const points = arr(v)
    .slice(0, 2000)
    .map((raw) => {
      const p = obj(raw, "A price record");
      const d = date(p.date);
      if (!d) throw new InvalidInput("Every price record needs a valid date.");
      const price = int(p.price, 0, 100_000_000);
      if (price <= 0) throw new InvalidInput(`The price record for ${d} needs a price above ₹0.`);
      return { date: d, price, retailer: str(p.retailer, 60) || "Unknown" };
    });
  return normaliseHistory(points);
}

function reviews(v: unknown): ExpertReview[] {
  return arr(v)
    .slice(0, 20)
    .map((raw) => {
      const r = obj(raw, "A review");
      const publisher = str(r.publisher, 120);
      if (!publisher) throw new InvalidInput("Every expert review needs a publisher.");
      const summary = text(r.summary, 600);
      if (!summary) throw new InvalidInput(`The ${publisher} review needs a short summary.`);
      const link = url(r.url);
      if (!link) throw new InvalidInput(`The ${publisher} review needs a valid link.`);
      const rating = r.rating === "" || r.rating === undefined || r.rating === null ? undefined : num(r.rating, NaN);
      return {
        publisher,
        summary,
        url: link,
        date: date(r.date),
        ...(rating !== undefined && Number.isFinite(rating) ? { rating: Math.min(10, Math.max(0, Math.round(rating * 10) / 10)) } : {}),
      };
    });
}

function benchmarks(v: unknown): Benchmark[] {
  return arr(v)
    .slice(0, 20)
    .map((raw) => {
      const b = obj(raw, "A benchmark");
      const name = str(b.name, 120);
      if (!name) throw new InvalidInput("Every benchmark needs a name.");
      const unit = str(b.unit, 20);
      return { name, value: num(b.value, 0), ...(unit ? { unit } : {}), higherIsBetter: b.higherIsBetter !== false };
    });
}

function feedback(v: unknown): UserFeedback | undefined {
  if (!v || typeof v !== "object") return undefined;
  const f = v as Obj;
  const count = int(f.count, 0, 100_000_000);
  if (count <= 0) return undefined;
  return {
    average: Math.min(5, Math.max(0, Math.round(num(f.average, 0) * 10) / 10)),
    count,
    highlights: strings(f.highlights, 8, 160),
  };
}

/** Clean a product coming from the editor. `existing` = the stored record when editing. */
export function sanitizeProduct(input: unknown): Validated<Omit<Product, "id" | "updatedAt">> {
  try {
    const p = obj(input, "The product");
    const category = String(p.category);
    if (!isCategorySlug(category)) throw new InvalidInput("Choose a valid category.");
    const cat = requireCategory(category);

    const brand = str(p.brand, 60);
    const name = str(p.name, 120);
    if (!brand) throw new InvalidInput("Add the brand (e.g. Aster).");
    if (!name) throw new InvalidInput("Add the model name (e.g. One Pro).");

    const productSlug = slug(p.slug);
    if (!productSlug) throw new InvalidInput("The URL slug may only use lowercase letters, numbers and dashes.");

    const art = p.art && typeof p.art === "object" ? (p.art as Obj) : {};
    const image = str(art.image, 300);
    if (image && !image.startsWith("/")) throw new InvalidInput("Photo paths must start with / and point into the public folder.");

    const subScores = Object.fromEntries(cat.criteria.map((c) => [c.key, int((p.subScores as Obj | undefined)?.[c.key], 0, 100)]));
    const needs = new Set(cat.needs.map((n) => n.key));
    const sourceList = sources(p.sources);
    requireSourcesValid(sourceList);

    const colors = arr(p.colors)
      .slice(0, 12)
      .map((raw) => {
        const c = obj(raw, "A colour option");
        return { name: str(c.name, 40), hex: hex(c.hex, "#888888") };
      })
      .filter((c) => c.name);

    const userFeedback = feedback(p.userFeedback);

    return {
      ok: true,
      value: {
        slug: productSlug,
        category,
        brand,
        name,
        tier: oneOf(p.tier, TIERS, "mid-range"),
        status: oneOf(p.status, STATUSES, "draft"),
        releaseDate: date(p.releaseDate),
        tagline: str(p.tagline, 160),
        summary: text(p.summary, 1200),
        colors,
        art: {
          primary: hex(art.primary, "#2f3136"),
          accent: hex(art.accent, "#8b93ff"),
          ...(image ? { image } : {}),
        },
        specs: specs(p.specs, category),
        subScores,
        scoreType: oneOf(p.scoreType, SCORE_TYPES, "editorial"),
        benchmarks: benchmarks(p.benchmarks),
        pros: strings(p.pros, 10),
        cons: strings(p.cons, 10),
        bestFor: strings(p.bestFor, 10, 40).filter((k) => needs.has(k)),
        msrp: int(p.msrp, 0, 100_000_000),
        offers: offers(p.offers),
        priceHistory: history(p.priceHistory),
        reviews: reviews(p.reviews),
        ...(userFeedback ? { userFeedback } : {}),
        sources: sourceList,
        verified: bool(p.verified),
        popularity: int(p.popularity, 0, 100, 50),
        featured: bool(p.featured),
      },
    };
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
}

/* ---------- news ---------- */

function paragraphs(v: unknown): string[] {
  return arr(v)
    .slice(0, 200)
    .map((x) => text(x, 6000))
    .filter(Boolean);
}

export function sanitizeArticle(input: unknown, productSlugs: Set<string>): Validated<Omit<NewsArticle, "id">> {
  try {
    const a = obj(input, "The article");
    const title = str(a.title, 200);
    if (!title) throw new InvalidInput("Add a headline.");
    const articleSlug = slug(a.slug);
    if (!articleSlug) throw new InvalidInput("The URL slug may only use lowercase letters, numbers and dashes.");
    const body = paragraphs(a.body);
    const status = oneOf(a.status, STATUSES, "draft");
    const publishedAt = isoDateTime(a.publishedAt);
    if (status === "published") {
      if (!str(a.excerpt)) throw new InvalidInput("Add a short excerpt before publishing.");
      if (body.length === 0) throw new InvalidInput("Write at least one paragraph before publishing.");
      if (!publishedAt) throw new InvalidInput("Set the publish date and time.");
    }
    const sourceList = sources(a.sources);
    requireSourcesValid(sourceList);
    const category = str(a.category, 20);
    return {
      ok: true,
      value: {
        slug: articleSlug,
        title,
        excerpt: str(a.excerpt, 400),
        body,
        kind: oneOf(a.kind, NEWS_KINDS, "industry"),
        tags: strings(a.tags, 12, 40),
        productSlugs: strings(a.productSlugs, 10, 120).filter((s) => productSlugs.has(s)),
        ...(isCategorySlug(category) ? { category } : {}),
        author: str(a.author, 80) || "Tech Intelligence",
        publishedAt: publishedAt || new Date().toISOString(),
        readMinutes: int(a.readMinutes, 1, 120, 3),
        featured: bool(a.featured),
        status,
        sources: sourceList,
      },
    };
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
}

/* ---------- guides ---------- */

/** `products` maps slug → category for every product that may be picked. */
export function sanitizeGuide(
  input: unknown,
  products: Map<string, { category: CategorySlug; status: PublishStatus }>,
): Validated<Omit<BuyingGuide, "id" | "updatedAt">> {
  try {
    const g = obj(input, "The guide");
    const title = str(g.title, 200);
    if (!title) throw new InvalidInput("Add a title.");
    const guideSlug = slug(g.slug);
    if (!guideSlug) throw new InvalidInput("The URL slug may only use lowercase letters, numbers and dashes.");
    const category = String(g.category);
    if (!isCategorySlug(category)) throw new InvalidInput("Choose a category.");
    const status = oneOf(g.status, STATUSES, "draft");

    const seen = new Set<string>();
    const picks: GuidePick[] = arr(g.picks)
      .slice(0, 10)
      .map((raw) => {
        const p = obj(raw, "A pick");
        return { productSlug: str(p.productSlug, 120), label: str(p.label, 60), reason: text(p.reason, 400) };
      })
      .filter((p) => p.productSlug);
    for (const p of picks) {
      const prod = products.get(p.productSlug);
      if (!prod) throw new InvalidInput(`Pick "${p.productSlug}" is not a known product.`);
      if (prod.category !== category) throw new InvalidInput(`Every pick must be a ${getCategory(category)?.singular ?? "product"} from this category.`);
      if (seen.has(p.productSlug)) throw new InvalidInput("The same product is picked twice.");
      seen.add(p.productSlug);
      if (!p.label) throw new InvalidInput("Every pick needs a label such as “Best overall”.");
      if (status === "published" && prod.status !== "published")
        throw new InvalidInput("A published guide can only pick published products.");
    }

    const body = paragraphs(g.body);
    const publishedAt = isoDateTime(g.publishedAt);
    if (status === "published") {
      if (picks.length === 0) throw new InvalidInput("Add at least one pick before publishing.");
      if (!str(g.excerpt)) throw new InvalidInput("Add a short excerpt before publishing.");
    }
    const budget = int(g.budgetMax, 0, 100_000_000, 0);
    return {
      ok: true,
      value: {
        slug: guideSlug,
        title,
        excerpt: str(g.excerpt, 400),
        category,
        ...(budget > 0 ? { budgetMax: budget } : {}),
        picks,
        body,
        author: str(g.author, 80) || "Tech Intelligence",
        publishedAt: publishedAt || new Date().toISOString(),
        status,
      },
    };
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
}

/* ---------- ads ---------- */

export function sanitizeAdSlot(input: unknown, current: AdSlot): Validated<AdSlot> {
  try {
    const s = obj(input, "The ad slot");
    const enabled = bool(s.enabled);
    const sponsor = str(s.sponsor, 80);
    const headline = str(s.headline, 120);
    const body = str(s.body, 280);
    const rawUrl = str(s.url, 2000);
    const link = url(rawUrl);
    if (rawUrl && !link) throw new InvalidInput(`${current.label}: the link must start with http:// or https://`);
    if (enabled && !headline) throw new InvalidInput(`${current.label}: add a headline before switching it on.`);
    if (enabled && !sponsor) throw new InvalidInput(`${current.label}: name the sponsor so the ad is clearly disclosed.`);
    return {
      ok: true,
      value: {
        id: current.id,
        label: current.label,
        location: current.location,
        enabled,
        ...(sponsor ? { sponsor } : {}),
        ...(headline ? { headline } : {}),
        ...(body ? { body } : {}),
        ...(link ? { url: link } : {}),
      },
    };
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
}

/* ---------- settings ---------- */

/** Weight overrides: only known criteria, 0–100, and dropped when equal to the defaults. */
export function sanitizeWeights(input: unknown): Validated<Partial<Record<CategorySlug, Record<string, number>>>> {
  try {
    const raw = input && typeof input === "object" ? (input as Obj) : {};
    const out: Partial<Record<CategorySlug, Record<string, number>>> = {};
    for (const [slugKey, weights] of Object.entries(raw)) {
      if (!isCategorySlug(slugKey) || !weights || typeof weights !== "object") continue;
      const cat = requireCategory(slugKey);
      const w = weights as Obj;
      const clean = Object.fromEntries(cat.criteria.map((c) => [c.key, int(w[c.key], 0, 100, c.weight)]));
      const total = Object.values(clean).reduce((a, b) => a + b, 0);
      if (total <= 0) throw new InvalidInput(`${cat.name}: at least one criterion needs a weight above 0.`);
      const isDefault = cat.criteria.every((c) => clean[c.key] === c.weight);
      if (!isDefault) out[slugKey] = clean;
    }
    return { ok: true, value: out };
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
}
