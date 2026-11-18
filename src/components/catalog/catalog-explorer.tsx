"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TIER_LABELS } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { CategoryConfig, Tier } from "@/lib/types";
import { cn } from "@/lib/format";
import { ActiveFilters } from "./active-filters";
import {
  activePills,
  budgetBuckets,
  clearFilters,
  computeFacets,
  countFilters,
  filterEntries,
  parseQuery,
  pluralNoun,
  priceBounds,
  serializeQuery,
  sortEntries,
  TIER_ORDER,
  type CatalogEntry,
} from "./catalog-query";
import { CatalogResults } from "./catalog-results";
import { CompareHelper } from "./compare-helper";
import { FilterPanel, type QueryUpdate } from "./filter-panel";
import { SearchField, SortSelect, ViewToggle } from "./toolbar-controls";

interface CatalogExplorerProps {
  category: CategoryConfig;
  entries: CatalogEntry[];
  /** server-rendered <AdSlot> (null-rendering when disabled) */
  adSlot?: ReactNode;
}

/**
 * Interactive listing for one category: search, tier chips, sort, view,
 * dynamic filters and results. All state lives in the URL query so any
 * filtered view can be shared or bookmarked.
 */
export function CatalogExplorer({ category, entries, adSlot }: CatalogExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const query = useMemo(() => parseQuery(new URLSearchParams(params.toString()), category), [params, category]);

  // Animate result changes only after the first user interaction, so server HTML isn't faded out.
  const [interacted, setInteracted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const update: QueryUpdate = useCallback(
    (fn) => {
      const next = fn(parseQuery(new URLSearchParams(window.location.search), category));
      const qs = serializeQuery(next, category);
      setInteracted(true);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [category, pathname, router],
  );

  const tiers = useMemo(
    () => TIER_ORDER.filter((t) => entries.some((e) => e.product.tier === t)),
    [entries],
  );
  const allPrices = useMemo(() => entries.map((e) => e.price), [entries]);
  const bounds = useMemo(() => priceBounds(allPrices), [allPrices]);
  const buckets = useMemo(() => budgetBuckets(allPrices), [allPrices]);
  const facets = useMemo(() => computeFacets(entries, query, category), [entries, query, category]);
  const results = useMemo(
    () => sortEntries(filterEntries(entries, query, category), query.sort),
    [entries, query, category],
  );
  const pills = useMemo(() => activePills(query, category, TIER_LABELS), [query, category]);
  const filterCount = countFilters(query);
  const noun = pluralNoun(category);

  const reset = () => update((q) => clearFilters({ ...q, q: "", tier: null }));

  const panel = (
    <FilterPanel
      category={category}
      query={query}
      facets={facets}
      onChange={update}
      priceBounds={bounds}
      budgetBuckets={buckets}
      allPrices={allPrices}
    />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
      {/* desktop sidebar */}
      <aside aria-label={`Filter ${noun}`} className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-1 no-scrollbar">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Filters</h2>
            {filterCount > 0 && (
              <button
                type="button"
                onClick={() => update((q) => clearFilters(q, true))}
                className="text-xs font-medium text-accent hover:text-accent-strong"
              >
                Reset
              </button>
            )}
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        {/* toolbar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchField
              value={query.q}
              onChange={(v) => update((q) => ({ ...q, q: v }))}
              placeholder={`Search ${noun}…`}
              className="min-w-0 flex-1 basis-60"
            />
            <Button
              variant="glass"
              className="lg:hidden"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
            >
              <SlidersHorizontal aria-hidden />
              Filters{filterCount > 0 ? ` (${filterCount})` : ""}
            </Button>
            <SortSelect value={query.sort} onChange={(v) => update((q) => ({ ...q, sort: v }))} />
            <ViewToggle value={query.view} onChange={(v) => update((q) => ({ ...q, view: v }))} />
          </div>

          {tiers.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar" role="group" aria-label="Tier">
              <Chip selected={!query.tier} onClick={() => update((q) => ({ ...q, tier: null }))}>
                All {category.shortName.toLowerCase()}
              </Chip>
              {tiers.map((t: Tier) => (
                <Chip
                  key={t}
                  selected={query.tier === t}
                  onClick={() => update((q) => ({ ...q, tier: q.tier === t ? null : t }))}
                >
                  {TIER_LABELS[t]}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-ink tnum">{results.length}</span> of {entries.length} {noun}
            </p>
          </div>
          <ActiveFilters pills={pills} onRemove={(p) => update(p.remove)} onClearAll={reset} />
        </div>

        <div className="mt-6">
          <CatalogResults
            entries={results}
            view={query.view}
            adSlot={adSlot}
            animateIn={interacted}
            noun={noun}
            onReset={reset}
          />
        </div>

        <div className="mt-12">
          <CompareHelper category={category} />
        </div>
      </div>

      {/* mobile filter sheet */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        count={results.length}
        noun={noun}
        filterCount={filterCount}
        onReset={() => update((q) => clearFilters(q, true))}
        reduce={!!reduce}
      >
        {panel}
      </FilterSheet>
    </div>
  );
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  count: number;
  noun: string;
  filterCount: number;
  onReset: () => void;
  reduce: boolean;
  children: ReactNode;
}

/** Bottom sheet holding the same filter panel on small screens. Filters apply live. */
function FilterSheet({ open, onClose, count, noun, filterCount, onReset, reduce, children }: FilterSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            tabIndex={-1}
            className="glass absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-panel outline-none"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            <div
              className={cn("flex items-center gap-3 border-t border-line px-5 pt-4")}
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <Button variant="ghost" onClick={onReset} disabled={filterCount === 0}>
                Reset
              </Button>
              <Button variant="ink" className="flex-1" onClick={onClose}>
                Show {count} {noun}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
