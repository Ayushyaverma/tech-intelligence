"use server";

/**
 * Admin server actions. Each one:
 *   1. re-checks the admin cookie (requireAdmin) — never trust the proxy alone,
 *   2. validates input (./validate),
 *   3. writes through @/lib/store,
 *   4. calls updateTag(CATALOG_TAG) so public pages refresh immediately.
 * They return an ActionResult ({ ok, error?, message?, id? }) instead of throwing,
 * so forms can show friendly messages.
 */
import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/data";
import { readCollection, updateCollection, writeCollection } from "@/lib/store";
import type { AdSlot, BuyingGuide, CategorySlug, NewsArticle, Product, PublishStatus, SiteSettings } from "@/lib/types";
import { UnauthorizedError, requireAdmin } from "./auth";
import { canVerify, productChecklist, publishBlockers } from "./checklist";
import { todayIst } from "./dates";
import { type ActionResult, productTitle, uniqueSlug } from "./templates";
import { normaliseHistory, sanitizeAdSlot, sanitizeArticle, sanitizeGuide, sanitizeProduct, sanitizeWeights } from "./validate";

/* ---------- plumbing ---------- */

async function run<T>(fn: () => ActionResult<T> | Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    const result = await fn();
    return { ...result, at: Date.now() };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: error.message, at: Date.now() };
    console.error("[admin] action failed", error);
    return { ok: false, error: "Something went wrong while saving. Nothing was changed — please try again.", at: Date.now() };
  }
}

function parsePayload(formData: FormData): unknown {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function refreshCatalog() {
  updateTag(CATALOG_TAG);
}

const now = () => new Date().toISOString();

/** Ids look like "p_aster-one-pro"; add "-2", "-3"... if one is already taken. */
function uniqueId(prefix: "p" | "n" | "g", slug: string, list: { id: string }[]): string {
  const taken = new Set(list.map((x) => x.id));
  let id = `${prefix}_${slug}`;
  for (let n = 2; taken.has(id); n++) id = `${prefix}_${slug}-${n}`;
  return id;
}

/** Replace a product slug everywhere it is referenced (news, guides, comparisons). */
function renameProductReferences(from: string, to: string) {
  updateCollection("news", (list) =>
    list.map((a) => (a.productSlugs.includes(from) ? { ...a, productSlugs: a.productSlugs.map((s) => (s === from ? to : s)) } : a)),
  );
  updateCollection("guides", (list) =>
    list.map((g) =>
      g.picks.some((p) => p.productSlug === from)
        ? { ...g, picks: g.picks.map((p) => (p.productSlug === from ? { ...p, productSlug: to } : p)) }
        : g,
    ),
  );
  updateCollection("comparisons", (list) =>
    list.map((c) => (c.productSlugs.includes(from) ? { ...c, productSlugs: c.productSlugs.map((s) => (s === from ? to : s)) } : c)),
  );
}

/** Where a product is used by published content (shown before archiving/deleting). */
function referenceCount(slug: string) {
  const news = readCollection("news").filter((a) => a.productSlugs.includes(slug)).length;
  const guides = readCollection("guides").filter((g) => g.picks.some((p) => p.productSlug === slug)).length;
  const comparisons = readCollection("comparisons").filter((c) => c.productSlugs.includes(slug)).length;
  return { news, guides, comparisons, total: news + guides + comparisons };
}

/* ---------- products ---------- */

/** Create or update a product. FormData: payload = product JSON (id "" for a new product). */
export async function saveProduct(_prev: ActionResult, formData: FormData): Promise<ActionResult<Product>> {
  return run<Product>(() => {
    const input = parsePayload(formData) as { id?: unknown } | null;
    if (!input) return { ok: false, error: "The form data was unreadable. Please reload and try again." };

    const products = readCollection("products");
    const id = typeof input.id === "string" ? input.id : "";
    const existing = id ? products.find((p) => p.id === id) : undefined;
    if (id && !existing) return { ok: false, error: "This product no longer exists — it may have been deleted." };

    const result = sanitizeProduct(input);
    if (!result.ok) return { ok: false, error: result.error };
    const clean = result.value;

    if (products.some((p) => p.slug === clean.slug && p.id !== id)) {
      return { ok: false, error: `Another product already uses the URL “${clean.slug}”. Choose a different slug.` };
    }

    const checklist = productChecklist({ ...clean, id: id || "new", updatedAt: "" });
    if (clean.verified && !canVerify(checklist)) {
      return { ok: false, error: "Finish the required checklist items before marking this product verified." };
    }
    const blockers = publishBlockers(checklist);
    if (clean.status === "published" && blockers.length) {
      return { ok: false, error: `Can't publish yet: ${blockers.join(", ").toLowerCase()}.` };
    }

    const finalId = existing?.id ?? uniqueId("p", clean.slug, products);
    const product: Product = { ...clean, id: finalId, updatedAt: now() };

    writeCollection(
      "products",
      existing ? products.map((p) => (p.id === finalId ? product : p)) : [...products, product],
    );
    if (existing && existing.slug !== product.slug) renameProductReferences(existing.slug, product.slug);
    refreshCatalog();

    const title = productTitle(product);
    return {
      ok: true,
      id: finalId,
      data: product,
      message: existing ? `Saved ${title}` : `Created ${title}`,
    };
  });
}

/** Copy a product as a new unverified draft. */
export async function duplicateProduct(id: string): Promise<ActionResult> {
  return run(() => {
    const products = readCollection("products");
    const source = products.find((p) => p.id === id);
    if (!source) return { ok: false, error: "Product not found." };
    const slug = uniqueSlug(`${source.slug}-copy`, products.map((p) => p.slug));
    const copy: Product = {
      ...structuredClone(source),
      id: uniqueId("p", slug, products),
      slug,
      name: `${source.name} (copy)`,
      status: "draft",
      verified: false,
      featured: false,
      updatedAt: now(),
    };
    writeCollection("products", [...products, copy]);
    refreshCatalog();
    return { ok: true, id: copy.id, message: `Duplicated as a draft: ${productTitle(copy)}` };
  });
}

/** Archive, restore (to draft) or publish from the products table. */
export async function setProductStatus(id: string, status: PublishStatus): Promise<ActionResult> {
  return run(() => {
    const products = readCollection("products");
    const product = products.find((p) => p.id === id);
    if (!product) return { ok: false, error: "Product not found." };
    if (status === "published") {
      const blockers = publishBlockers(productChecklist(product));
      if (blockers.length) return { ok: false, error: `Can't publish yet: ${blockers.join(", ").toLowerCase()}.` };
    }
    writeCollection(
      "products",
      products.map((p) => (p.id === id ? { ...p, status, updatedAt: now() } : p)),
    );
    refreshCatalog();
    const refs = referenceCount(product.slug);
    const title = productTitle(product);
    const note =
      status === "archived" && refs.total
        ? ` It is still mentioned in ${refs.total} article/guide/comparison${refs.total === 1 ? "" : "s"}, which will hide it.`
        : "";
    const verb = status === "archived" ? "Archived" : status === "published" ? "Published" : "Restored to drafts:";
    return { ok: true, message: `${verb} ${title}.${note}` };
  });
}

/** Permanently delete a product. `confirmation` must equal its slug. Removes it from articles, guides and comparisons. */
export async function deleteProduct(id: string, confirmation: string): Promise<ActionResult> {
  return run(() => {
    const products = readCollection("products");
    const product = products.find((p) => p.id === id);
    if (!product) return { ok: false, error: "Product not found." };
    if (confirmation.trim() !== product.slug) return { ok: false, error: "The confirmation text doesn't match." };

    writeCollection("products", products.filter((p) => p.id !== id));
    updateCollection("news", (list) =>
      list.map((a) => (a.productSlugs.includes(product.slug) ? { ...a, productSlugs: a.productSlugs.filter((s) => s !== product.slug) } : a)),
    );
    updateCollection("guides", (list) =>
      list.map((g) =>
        g.picks.some((p) => p.productSlug === product.slug) ? { ...g, picks: g.picks.filter((p) => p.productSlug !== product.slug) } : g,
      ),
    );
    updateCollection("comparisons", (list) =>
      list
        .map((c) => ({ ...c, productSlugs: c.productSlugs.filter((s) => s !== product.slug) }))
        .filter((c) => c.productSlugs.length >= 2),
    );
    refreshCatalog();
    return { ok: true, message: `Deleted ${productTitle(product)}.` };
  });
}

/* ---------- quick price updates ---------- */

export interface PriceUpdate {
  productId: string;
  offers: { retailer: string; price: number; inStock: boolean }[];
  /** also append today's lowest in-stock price to the price history */
  record: boolean;
}

/** Bulk-update offer prices from /admin/prices. Every touched offer gets checkedAt = now. */
export async function updatePrices(updates: PriceUpdate[]): Promise<ActionResult> {
  return run(() => {
    if (!Array.isArray(updates) || updates.length === 0) return { ok: false, error: "There are no changes to save." };
    if (updates.length > 500) return { ok: false, error: "Too many changes in one save." };

    const products = readCollection("products");
    const byId = new Map(products.map((p) => [p.id, p]));
    const checkedAt = now();
    const today = todayIst();
    let recorded = 0;

    for (const u of updates) {
      const product = byId.get(String(u?.productId));
      if (!product) return { ok: false, error: "One of the products no longer exists. Reload the page." };
      const offers = [];
      for (const o of product.offers) {
        const change = Array.isArray(u.offers) ? u.offers.find((c) => c?.retailer === o.retailer) : undefined;
        if (!change) {
          offers.push(o);
          continue;
        }
        const price = Math.round(Number(change.price));
        if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) {
          return { ok: false, error: `${productTitle(product)} · ${o.retailer}: enter a price above ₹0.` };
        }
        offers.push({ ...o, price, inStock: change.inStock === true, checkedAt });
      }

      let priceHistory = product.priceHistory;
      if (u.record) {
        const pool = offers.filter((o) => o.inStock);
        const best = [...(pool.length ? pool : offers)].sort((a, b) => a.price - b.price)[0];
        if (best) {
          priceHistory = normaliseHistory([...priceHistory, { date: today, price: best.price, retailer: best.retailer }]);
          recorded++;
        }
      }
      byId.set(product.id, { ...product, offers, priceHistory, updatedAt: checkedAt });
    }

    writeCollection(
      "products",
      products.map((p) => byId.get(p.id) ?? p),
    );
    refreshCatalog();
    const n = updates.length;
    return {
      ok: true,
      message: `Updated ${n} product${n === 1 ? "" : "s"}${recorded ? ` · ${recorded} price record${recorded === 1 ? "" : "s"} added` : ""}.`,
    };
  });
}

/* ---------- news ---------- */

export async function saveArticle(_prev: ActionResult, formData: FormData): Promise<ActionResult<NewsArticle>> {
  return run<NewsArticle>(() => {
    const input = parsePayload(formData) as { id?: unknown } | null;
    if (!input) return { ok: false, error: "The form data was unreadable. Please reload and try again." };
    const news = readCollection("news");
    const id = typeof input.id === "string" ? input.id : "";
    const existing = id ? news.find((a) => a.id === id) : undefined;
    if (id && !existing) return { ok: false, error: "This article no longer exists." };

    const products = readCollection("products");
    const result = sanitizeArticle(input, new Set(products.map((p) => p.slug)));
    if (!result.ok) return { ok: false, error: result.error };
    const clean = result.value;

    if (news.some((a) => a.slug === clean.slug && a.id !== id)) {
      return { ok: false, error: `Another article already uses the URL “${clean.slug}”.` };
    }
    if (clean.status === "published") {
      const hidden = clean.productSlugs.filter((s) => products.find((p) => p.slug === s)?.status !== "published");
      if (hidden.length) return { ok: false, error: `Related products must be published first: ${hidden.join(", ")}.` };
    }

    const finalId = existing?.id ?? uniqueId("n", clean.slug, news);
    const article = { ...clean, id: finalId };
    writeCollection("news", existing ? news.map((a) => (a.id === finalId ? article : a)) : [...news, article]);
    refreshCatalog();
    return { ok: true, id: finalId, data: article, message: existing ? "Article saved" : "Article created" };
  });
}

export async function setArticleStatus(id: string, status: PublishStatus): Promise<ActionResult> {
  return run(() => {
    const news = readCollection("news");
    const article = news.find((a) => a.id === id);
    if (!article) return { ok: false, error: "Article not found." };
    if (status === "published" && (!article.excerpt || article.body.length === 0)) {
      return { ok: false, error: "Open the article and add an excerpt and body before publishing." };
    }
    writeCollection("news", news.map((a) => (a.id === id ? { ...a, status } : a)));
    refreshCatalog();
    return { ok: true, message: status === "published" ? "Article published." : status === "archived" ? "Article archived." : "Article moved to drafts." };
  });
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  return run(() => {
    const news = readCollection("news");
    if (!news.some((a) => a.id === id)) return { ok: false, error: "Article not found." };
    writeCollection("news", news.filter((a) => a.id !== id));
    refreshCatalog();
    return { ok: true, message: "Article deleted." };
  });
}

/* ---------- guides ---------- */

export async function saveGuide(_prev: ActionResult, formData: FormData): Promise<ActionResult<BuyingGuide>> {
  return run<BuyingGuide>(() => {
    const input = parsePayload(formData) as { id?: unknown } | null;
    if (!input) return { ok: false, error: "The form data was unreadable. Please reload and try again." };
    const guides = readCollection("guides");
    const id = typeof input.id === "string" ? input.id : "";
    const existing = id ? guides.find((g) => g.id === id) : undefined;
    if (id && !existing) return { ok: false, error: "This guide no longer exists." };

    const products = new Map(readCollection("products").map((p) => [p.slug, { category: p.category, status: p.status }]));
    const result = sanitizeGuide(input, products);
    if (!result.ok) return { ok: false, error: result.error };
    const clean = result.value;
    if (guides.some((g) => g.slug === clean.slug && g.id !== id)) {
      return { ok: false, error: `Another guide already uses the URL “${clean.slug}”.` };
    }

    const finalId = existing?.id ?? uniqueId("g", clean.slug, guides);
    const guide = { ...clean, id: finalId, updatedAt: now() };
    writeCollection("guides", existing ? guides.map((g) => (g.id === finalId ? guide : g)) : [...guides, guide]);
    refreshCatalog();
    return { ok: true, id: finalId, data: guide, message: existing ? "Guide saved" : "Guide created" };
  });
}

export async function setGuideStatus(id: string, status: PublishStatus): Promise<ActionResult> {
  return run(() => {
    const guides = readCollection("guides");
    const guide = guides.find((g) => g.id === id);
    if (!guide) return { ok: false, error: "Guide not found." };
    if (status === "published") {
      if (guide.picks.length === 0) return { ok: false, error: "Add at least one pick before publishing." };
      const products = readCollection("products");
      const hidden = guide.picks.filter((p) => products.find((x) => x.slug === p.productSlug)?.status !== "published");
      if (hidden.length) return { ok: false, error: "Every pick must be a published product before the guide can go live." };
    }
    writeCollection("guides", guides.map((g) => (g.id === id ? { ...g, status, updatedAt: now() } : g)));
    refreshCatalog();
    return { ok: true, message: status === "published" ? "Guide published." : status === "archived" ? "Guide archived." : "Guide moved to drafts." };
  });
}

export async function deleteGuide(id: string): Promise<ActionResult> {
  return run(() => {
    const guides = readCollection("guides");
    if (!guides.some((g) => g.id === id)) return { ok: false, error: "Guide not found." };
    writeCollection("guides", guides.filter((g) => g.id !== id));
    refreshCatalog();
    return { ok: true, message: "Guide deleted." };
  });
}

/* ---------- advertising ---------- */

/** Save all five ad slots. Slot ids, labels and locations are fixed in data — only content and the switch change. */
export async function saveAdSlots(slots: AdSlot[]): Promise<ActionResult> {
  return run(() => {
    const settings = readCollection("settings");
    const next: AdSlot[] = [];
    for (const current of settings.adSlots) {
      const incoming = Array.isArray(slots) ? slots.find((s) => s?.id === current.id) : undefined;
      if (!incoming) {
        next.push(current);
        continue;
      }
      const result = sanitizeAdSlot(incoming, current);
      if (!result.ok) return { ok: false, error: result.error };
      next.push(result.value);
    }
    writeCollection("settings", { ...settings, adSlots: next });
    refreshCatalog();
    const live = next.filter((s) => s.enabled).length;
    return { ok: true, message: live ? `Ad slots saved · ${live} live` : "Ad slots saved · all switched off" };
  });
}

/* ---------- settings ---------- */

export interface SettingsInput {
  siteName: string;
  demoMode: boolean;
  newsletterEnabled: boolean;
  weightOverrides: Partial<Record<CategorySlug, Record<string, number>>>;
}

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  return run(() => {
    const weights = sanitizeWeights(input?.weightOverrides);
    if (!weights.ok) return { ok: false, error: weights.error };
    const siteName = typeof input?.siteName === "string" ? input.siteName.trim().slice(0, 60) : "";
    if (!siteName) return { ok: false, error: "The site name can't be empty." };
    const settings = readCollection("settings");
    const next: SiteSettings = {
      ...settings,
      siteName,
      demoMode: input.demoMode === true,
      newsletterEnabled: input.newsletterEnabled === true,
      weightOverrides: weights.value,
    };
    if (Object.keys(weights.value).length === 0) delete next.weightOverrides;
    writeCollection("settings", next);
    refreshCatalog();
    return { ok: true, message: "Settings saved — scores across the site are updated." };
  });
}

/* ---------- inbox ---------- */

export async function deleteSubscriber(email: string): Promise<ActionResult> {
  return run(() => {
    const target = String(email).toLowerCase();
    let found = false;
    updateCollection("subscribers", (list) =>
      list.filter((s) => {
        const match = s.email === target;
        found ||= match;
        return !match;
      }),
    );
    return found ? { ok: true, message: `Removed ${target}.` } : { ok: false, error: "Subscriber not found." };
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return run(() => {
    let found = false;
    updateCollection("messages", (list) =>
      list.filter((m) => {
        const match = m.id === id;
        found ||= match;
        return !match;
      }),
    );
    return found ? { ok: true, message: "Message deleted." } : { ok: false, error: "Message not found." };
  });
}
