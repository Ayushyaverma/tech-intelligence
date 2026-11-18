"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Newspaper, Search, SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DeviceArt, type DeviceVariant } from "@/components/device-art";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { ScoreBadge } from "@/components/ui/score";
import type { CategoryConfig, CategorySlug, ProductArt } from "@/lib/types";
import { cn } from "@/lib/format";

export interface SearchDoc {
  type: "product" | "article" | "guide";
  href: string;
  title: string;
  subtitle: string;
  /** lowercase text searched against */
  text: string;
  category?: CategorySlug;
  score?: number;
  price?: number;
  art?: ProductArt;
  variant?: DeviceVariant;
  popularity: number;
}

interface SearchResultsProps {
  docs: SearchDoc[];
  categories: Pick<CategoryConfig, "slug" | "name" | "icon">[];
  suggestions: string[];
}

/** Every query word must appear; matches in the title rank higher. */
function rank(doc: SearchDoc, words: string[]): number {
  let score = 0;
  const title = doc.title.toLowerCase();
  for (const w of words) {
    if (!doc.text.includes(w)) return -1;
    score += title.includes(w) ? 10 : 2;
    if (title.startsWith(w)) score += 5;
  }
  return score + doc.popularity / 100;
}

export function SearchResults({ docs, categories, suggestions }: SearchResultsProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = (params.get("q") ?? "").slice(0, 80);
  const [text, setText] = useState(q);

  // Follow back/forward navigation.
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setText(q);
  }

  const words = useMemo(() => q.toLowerCase().split(/\s+/).filter(Boolean), [q]);
  const results = useMemo(() => {
    if (!words.length) return { products: [], articles: [], guides: [] };
    const hits = docs
      .map((d) => ({ d, r: rank(d, words) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => b.r - a.r)
      .map((x) => x.d);
    return {
      products: hits.filter((d) => d.type === "product"),
      articles: hits.filter((d) => d.type === "article"),
      guides: hits.filter((d) => d.type === "guide"),
    };
  }, [docs, words]);
  const total = results.products.length + results.articles.length + results.guides.length;
  const matchingCategories = categories.filter((c) => words.some((w) => c.name.toLowerCase().includes(w)));

  function submit(value: string) {
    const v = value.trim();
    router.replace(v ? `${pathname}?q=${encodeURIComponent(v)}` : pathname, { scroll: false });
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="relative max-w-2xl"
      >
        <label htmlFor="site-search" className="sr-only">
          Search products, news and guides
        </label>
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          id="site-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search phones, laptops, brands, specs…"
          autoComplete="off"
          className="h-14 w-full rounded-full border border-line bg-surface pl-14 pr-32 text-base text-ink shadow-sm outline-none transition-shadow placeholder:text-subtle focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)]"
        />
        <button type="submit" className="btn-ink absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full px-5 text-sm font-medium">
          Search
        </button>
      </form>

      {!words.length ? (
        <div className="mt-10">
          <p className="eyebrow mb-3">Try</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="btn-glass rounded-full px-4 py-2 text-sm font-medium text-ink"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="eyebrow mb-3 mt-10">Browse categories</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="card card-hover flex flex-col items-center gap-2 px-3 py-5 text-sm font-medium text-ink"
              >
                <CategoryIcon icon={c.icon} className="size-5 text-accent" />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-ink tnum">{total}</span> result{total === 1 ? "" : "s"} for “{q}”
          </p>

          {matchingCategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {matchingCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-ink"
                >
                  <CategoryIcon icon={c.icon} className="size-4" /> Browse all {c.name.toLowerCase()}
                </Link>
              ))}
            </div>
          )}

          {total === 0 ? (
            <div className="mt-10">
              <EmptyState
                icon={SearchX}
                title="No results"
                description="Check the spelling, try a brand or category name, or search for a spec such as “OLED” or “16 GB”."
              />
            </div>
          ) : (
            <div className="mt-8 space-y-12">
              {results.products.length > 0 && (
                <ResultGroup title="Products" count={results.products.length}>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {results.products.map((d) => (
                      <li key={d.href}>
                        <Link href={d.href} className="card card-hover flex items-center gap-4 p-3">
                          <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-surface-2 p-2">
                            {d.art && d.category && (
                              <DeviceArt
                                category={d.category}
                                primary={d.art.primary}
                                accent={d.art.accent}
                                variant={d.variant}
                                className="h-full w-full"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-muted">{d.subtitle}</span>
                            <span className="block truncate text-sm font-semibold text-ink">{d.title}</span>
                            {d.price !== undefined && <Price value={d.price} size="sm" className="text-ink-2" />}
                          </span>
                          {d.score !== undefined && <ScoreBadge score={d.score} size="sm" />}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ResultGroup>
              )}
              {results.articles.length > 0 && (
                <ResultGroup title="News & reviews" count={results.articles.length}>
                  <TextList docs={results.articles} icon="news" />
                </ResultGroup>
              )}
              {results.guides.length > 0 && (
                <ResultGroup title="Buying guides" count={results.guides.length}>
                  <TextList docs={results.guides} icon="guide" />
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-baseline gap-2 text-lg font-semibold tracking-tight text-ink">
        {title} <span className="text-sm font-normal text-muted tnum">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function TextList({ docs, icon }: { docs: SearchDoc[]; icon: "news" | "guide" }) {
  const Icon = icon === "news" ? Newspaper : BookOpen;
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {docs.map((d) => (
        <li key={d.href}>
          <Link href={d.href} className={cn("group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2")}>
            <Icon className="size-4 shrink-0 text-subtle" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{d.title}</span>
              <span className="block text-xs text-muted">{d.subtitle}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
