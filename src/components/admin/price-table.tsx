"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Save, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { DeviceArt } from "@/components/device-art";
import { toast } from "@/components/ui/toast";
import { updatePrices, type PriceUpdate } from "@/lib/admin/actions";
import { formatDayIst } from "@/lib/admin/dates";
import { STALE_DAYS } from "@/lib/admin/insights";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug, ProductArt } from "@/lib/types";
import { cn } from "@/lib/format";
import { Checkbox, CONTROL, Select } from "./fields";

export interface PriceRow {
  id: string;
  slug: string;
  title: string;
  category: CategorySlug;
  art: ProductArt;
  variant?: "over-ear" | "earbuds";
  staleDays: number | null;
  offers: { retailer: string; price: number; inStock: boolean; checkedAt: string }[];
}

type Draft = Record<string, { offers: Record<string, { price: string; inStock: boolean }>; record: boolean }>;

/** Inline price editing across the catalogue; only changed rows are sent on save. */
export function PriceTable({ rows }: { rows: PriceRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [staleOnly, setStaleOnly] = useState(false);
  const [draft, setDraft] = useState<Draft>({});

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!needle || `${r.title} ${r.slug}`.toLowerCase().includes(needle)) &&
        (!category || r.category === category) &&
        (!staleOnly || (r.staleDays !== null && r.staleDays > STALE_DAYS)),
    );
  }, [rows, q, category, staleOnly]);

  const changed = Object.keys(draft);

  function edit(row: PriceRow, retailer: string, patch: Partial<{ price: string; inStock: boolean }>) {
    setDraft((d) => {
      const entry = d[row.id] ?? { offers: {}, record: true };
      const base = row.offers.find((o) => o.retailer === retailer)!;
      const cur = entry.offers[retailer] ?? { price: String(base.price), inStock: base.inStock };
      return { ...d, [row.id]: { ...entry, offers: { ...entry.offers, [retailer]: { ...cur, ...patch } } } };
    });
  }

  function save() {
    const updates: PriceUpdate[] = changed.map((id) => ({
      productId: id,
      record: draft[id].record,
      offers: Object.entries(draft[id].offers).map(([retailer, v]) => ({
        retailer,
        price: Number(v.price),
        inStock: v.inStock,
      })),
    }));
    start(async () => {
      const r = await updatePrices(updates);
      if (r.ok) {
        toast(r.message ?? "Prices saved", { tone: "positive" });
        setDraft({});
        router.refresh();
      } else toast(r.error ?? "Could not save", { tone: "warning" });
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={cn(CONTROL, "h-10 pl-9")} />
        </label>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as CategorySlug | "")} className="h-10 sm:w-40">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.shortName}</option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <Checkbox checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} /> Stale only (&gt;{STALE_DAYS} days)
        </label>
        <button
          type="button"
          onClick={save}
          disabled={!changed.length || pending}
          className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium disabled:opacity-50 sm:ml-auto"
        >
          <Save className="size-4" aria-hidden />
          {pending ? "Saving…" : `Save ${changed.length || ""} change${changed.length === 1 ? "" : "s"}`}
        </button>
      </div>

      <ul className="divide-y divide-line">
        {visible.map((r) => {
          const d = draft[r.id];
          return (
            <li key={r.id} className={cn("grid gap-4 px-4 py-4 lg:grid-cols-[16rem_minmax(0,1fr)]", d && "bg-accent-soft/40")}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2 p-1">
                  <DeviceArt category={r.category} primary={r.art.primary} accent={r.art.accent} variant={r.variant} className="h-full w-full" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.title}</p>
                  <p className={cn("text-xs", r.staleDays !== null && r.staleDays > STALE_DAYS ? "text-warning" : "text-muted")}>
                    Checked {formatDayIst(r.offers.map((o) => o.checkedAt).sort().at(-1))}
                  </p>
                  {d && (
                    <label className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
                      <Checkbox
                        checked={d.record}
                        onChange={(e) => setDraft((all) => ({ ...all, [r.id]: { ...all[r.id], record: e.target.checked } }))}
                      />
                      Record to price history
                    </label>
                  )}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {r.offers.map((o) => {
                  const v = d?.offers[o.retailer];
                  return (
                    <div key={o.retailer} className="rounded-xl border border-line bg-surface p-2.5">
                      <p className="mb-1.5 text-xs font-medium text-muted">{o.retailer}</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">₹</span>
                          <input
                            aria-label={`${r.title} ${o.retailer} price`}
                            inputMode="numeric"
                            value={v?.price ?? String(o.price)}
                            onChange={(e) => edit(r, o.retailer, { price: e.target.value.replace(/\D/g, "") })}
                            className={cn(CONTROL, "h-9 pl-6 tnum")}
                          />
                        </div>
                        <label className="flex items-center gap-1 text-xs text-ink-2" title="In stock">
                          <Checkbox
                            aria-label={`${o.retailer} in stock`}
                            checked={v?.inStock ?? o.inStock}
                            onChange={(e) => edit(r, o.retailer, { inStock: e.target.checked })}
                          />
                          Stock
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">No products match.</p>}
    </div>
  );
}
