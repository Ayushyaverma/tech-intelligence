"use client";

import Link from "next/link";
import { ArrowUpRight, Link2, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCompare } from "@/components/compare/compare-provider";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { requireCategory } from "@/lib/categories";
import { compareHref, productHref } from "@/lib/product-utils";
import type { CategorySlug } from "@/lib/types";
import { COLUMN_VARS, ColumnsProvider } from "./compare-grid";
import { CompareEmpty } from "./compare-empty";
import { MAX_COMPARE, needVerdicts, parseIds, resolveSelection } from "./compare-logic";
import { ComparePicker, type PickerMode } from "./compare-picker";
import { ComparePrices, CompareProsCons } from "./compare-prices";
import { CompareScores } from "./compare-scores";
import { CompareSpecs } from "./compare-specs";
import { CompareSummary } from "./compare-summary";
import { CompareVerdicts } from "./compare-verdicts";
import { StickyColumns } from "./sticky-columns";
import type { CompareData, CompareProduct } from "./types";

interface CompareViewProps {
  data: CompareData;
  /** server-rendered <AdSlot id="compare-below-results"> */
  adSlot?: ReactNode;
}

/**
 * The comparison page. The URL (?ids=a,b,c) is the source of truth so every
 * comparison is shareable; the floating compare tray's selection is kept in
 * sync with it in both directions.
 *
 * Rules: 2–5 products, one category, remove + replace, differences
 * highlighted, "best for" verdicts per need instead of one winner.
 */
export function CompareView({ data, adSlot }: CompareViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const compare = useCompare();

  const bySlug = useMemo(() => new Map(data.products.map((p) => [p.slug, p])), [data.products]);
  const idsParam = params.get("ids");
  const urlIds = useMemo(() => parseIds(idsParam), [idsParam]);
  const resolved = useMemo(() => resolveSelection(urlIds, bySlug), [urlIds, bySlug]);

  // What we show: the URL selection when present, otherwise the saved tray selection.
  const selection: CompareProduct[] = useMemo(() => {
    if (urlIds.length) return resolved.products;
    return compare.items.map((i) => bySlug.get(i.slug)).filter((p): p is CompareProduct => !!p);
  }, [urlIds.length, resolved.products, compare.items, bySlug]);

  const category = selection[0]?.category ?? null;
  const config = category ? requireCategory(category) : null;
  const slugs = selection.map((p) => p.slug);

  const navigate = useCallback(
    (next: string[]) => {
      // The URL drives the tray (effect below). Clearing is the exception: with no
      // ids in the URL the tray would otherwise be written back to the address bar.
      if (!next.length) {
        compare.clear();
        router.replace(pathname, { scroll: false });
        return;
      }
      router.replace(compareHref(next), { scroll: false });
    },
    [compare, pathname, router],
  );

  // URL → tray: adopt a shared link's selection, and explain anything we had to drop.
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (!urlIds.length) return;
    const want = resolved.products.map((p) => p.slug).join(",");
    const have = compare.items.map((i) => i.slug).join(",");
    if (want !== have) compare.replaceAll(resolved.products.map((p) => p.item));

    if (announced.current === idsParam) return;
    announced.current = idsParam;
    if (resolved.mismatched.length) {
      toast(`Removed ${resolved.mismatched.length} product(s) from another category — comparisons stay within one category`, {
        tone: "warning",
      });
    }
    if (resolved.overflow.length) toast(`Showing the first ${MAX_COMPARE} products — that's the maximum`, { tone: "warning" });
    if (resolved.unknown.length) toast("Some products in this link are no longer available", { tone: "warning" });
    // Clean the URL so it matches what is shown.
    if (resolved.mismatched.length || resolved.overflow.length || resolved.unknown.length) {
      router.replace(resolved.products.length ? compareHref(resolved.products.map((p) => p.slug)) : pathname, {
        scroll: false,
      });
    }
  }, [urlIds.length, idsParam, resolved, compare, router, pathname]);

  // Tray → URL: arriving on /compare with a saved selection writes it to the address bar.
  useEffect(() => {
    if (urlIds.length || !compare.items.length) return;
    router.replace(compareHref(compare.items.map((i) => i.slug)), { scroll: false });
  }, [urlIds.length, compare.items, router]);

  /* ---------- picker ---------- */
  const [picker, setPicker] = useState<{ open: boolean; mode: PickerMode; category: CategorySlug | null }>({
    open: false,
    mode: { kind: "add" },
    category: null,
  });
  const closePicker = useCallback(() => setPicker((p) => ({ ...p, open: false })), []);
  const openAdd = () => setPicker({ open: true, mode: { kind: "add" }, category });
  const openReplace = (slug: string) => setPicker({ open: true, mode: { kind: "replace", slug }, category });
  const openStart = (c: CategorySlug) => setPicker({ open: true, mode: { kind: "add" }, category: c });

  function pick(p: CompareProduct) {
    let next: string[];
    if (picker.mode.kind === "replace") {
      const target = picker.mode.slug;
      next = slugs.map((s) => (s === target ? p.slug : s));
    } else {
      next = slugs.length >= MAX_COMPARE ? slugs : [...slugs, p.slug];
    }
    navigate(next);
    closePicker();
  }

  function removeProduct(slug: string) {
    navigate(slugs.filter((s) => s !== slug));
  }

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Comparison link copied", { tone: "positive" });
    } catch {
      toast("Copy the link from your address bar to share this comparison");
    }
  }

  const pickerEl = (
    <ComparePicker
      open={picker.open}
      mode={picker.mode}
      products={data.products}
      category={picker.category}
      selected={slugs}
      onPick={pick}
      onClose={closePicker}
    />
  );

  /* ---------- empty ---------- */
  if (!config || selection.length === 0) {
    return (
      <>
        <CompareEmpty trending={data.trending} onStart={openStart} />
        {pickerEl}
      </>
    );
  }

  const criteria = data.criteria[config.slug];
  const verdicts = needVerdicts(config, criteria, selection);
  const ready = selection.length >= 2;

  return (
    <ColumnsProvider count={selection.length} withAdd={selection.length < MAX_COMPARE}>
      {/* COLUMN_VARS sets the label/product column widths every comparison grid uses */}
      <div className={COLUMN_VARS}>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Comparison</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Compare {config.name.toLowerCase()}</h1>
          <p className="mt-2 text-sm text-muted">
            {selection.length} of {MAX_COMPARE} selected · differences are highlighted, best values marked with a tick.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="glass" size="sm" onClick={share}>
            <Link2 aria-hidden /> Copy link
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate([])}>
            <Trash2 aria-hidden /> Clear all
          </Button>
        </div>
      </div>

      <StickyColumns
        products={selection}
        category={config}
        onAdd={openAdd}
        onRemove={removeProduct}
        onReplace={openReplace}
      />

      {!ready ? (
        <div className="card mt-6 flex flex-col items-center gap-4 rounded-panel px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Add at least one more {config.singular}</h2>
          <p className="max-w-md text-muted">
            A comparison needs two to five {config.name.toLowerCase()}. Pick another to see scores, specs, prices and
            verdicts side by side.
          </p>
          <Button variant="ink" size="lg" onClick={openAdd}>
            <Plus aria-hidden /> Add a {config.singular}
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <CompareSummary products={selection} category={config} verdicts={verdicts} />
          <CompareVerdicts verdicts={verdicts} />
          <CompareScores products={selection} criteria={criteria} />
          <CompareSpecs products={selection} category={config} />
          <ComparePrices products={selection} />
          <CompareProsCons products={selection} />

          <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-ink">View complete specifications</p>
            <div className="flex flex-wrap gap-2">
              {selection.map((p) => (
                <Link
                  key={p.slug}
                  href={productHref(p)}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  {p.brand} {p.name} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              ))}
            </div>
          </div>

          {adSlot}
        </div>
      )}
      </div>
      {pickerEl}
    </ColumnsProvider>
  );
}
