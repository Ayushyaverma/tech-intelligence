"use client";

import { Check, ChevronDown, ListChecks, Minus } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { bestIndexes } from "@/lib/product-utils";
import type { CategoryConfig, SpecField } from "@/lib/types";
import { cn } from "@/lib/format";
import { ColumnCell, ColumnRow, ColumnScroller } from "./compare-grid";
import { CompareSection } from "./compare-section";
import { allSame, displaySpec } from "./compare-logic";
import type { CompareProduct } from "./types";

interface SpecRow {
  field: SpecField;
  values: string[];
  best: number[];
  same: boolean;
}

interface SpecGroup {
  name: string;
  rows: SpecRow[];
}

function buildGroups(category: CategoryConfig, products: CompareProduct[]): SpecGroup[] {
  return category.specGroups
    .map((name) => ({
      name,
      rows: category.specs
        .filter((f) => f.group === name)
        .map((field) => {
          const raw = products.map((p) => p.specs[field.key]);
          const values = raw.map((v) => displaySpec(field, v));
          return { field, values, best: bestIndexes(field, raw), same: allSame(values) };
        }),
    }))
    .filter((g) => g.rows.length > 0);
}

interface CompareSpecsProps {
  products: CompareProduct[];
  category: CategoryConfig;
}

/** Full spec sheet, grouped like the product page, with differences highlighted. */
export function CompareSpecs({ products, category }: CompareSpecsProps) {
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const groups = buildGroups(category, products);
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const differing = groups.reduce((n, g) => n + g.rows.filter((r) => !r.same).length, 0);

  function toggleGroup(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <CompareSection
      id="specs"
      icon={ListChecks}
      title="Specifications"
      description={
        <>
          <span className="font-medium text-ink-2 tnum">{differing}</span> of{" "}
          <span className="tnum">{total}</span> specs differ. The better figure in each row is marked{" "}
          <span className="inline-flex translate-y-px items-center text-positive">
            <Check className="size-3.5" strokeWidth={3} aria-label="with a check" />
          </span>
          .
        </>
      }
      actions={<Switch checked={onlyDiff} onChange={setOnlyDiff} label="Show only differences" />}
    >
      <div className="divide-y divide-line">
        {groups.map((g) => {
          const rows = onlyDiff ? g.rows.filter((r) => !r.same) : g.rows;
          const open = !collapsed.has(g.name);
          const diffCount = g.rows.filter((r) => !r.same).length;
          const panelId = `spec-group-${g.name.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <div key={g.name}>
              <h3>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.name)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className={cn(
                    "group flex w-full items-center justify-between gap-3 rounded-lg py-3.5 text-left",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[15px] font-semibold tracking-tight text-ink">{g.name}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted tnum">
                      {diffCount ? `${diffCount} ${diffCount === 1 ? "difference" : "differences"}` : "All identical"}
                    </span>
                  </span>
                  <span className="grid size-7 place-items-center rounded-full text-muted transition-colors duration-150 group-hover:bg-surface-2 group-hover:text-ink">
                    <ChevronDown
                      className={cn("size-4 transition-transform duration-200", open ? "rotate-0" : "-rotate-90")}
                      aria-hidden
                    />
                  </span>
                </button>
              </h3>
              {open && (
                <div id={panelId} className="pb-3">
                  {rows.length ? (
                    <ColumnScroller>
                      <div className="divide-y divide-line/70">
                        {rows.map((r) => (
                          <SpecRowView key={r.field.key} row={r} products={products} />
                        ))}
                      </div>
                    </ColumnScroller>
                  ) : (
                    <p className="flex items-center gap-2 rounded-xl bg-surface-2/60 px-4 py-3 text-[13px] text-muted">
                      <Minus className="size-3.5" aria-hidden />
                      Every product here has the same {g.name.toLowerCase()} specs.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CompareSection>
  );
}

function SpecRowView({ row, products }: { row: SpecRow; products: CompareProduct[] }) {
  const { field, values, best, same } = row;
  return (
    <ColumnRow
      ariaLabel={field.label}
      label={
        <span className="flex items-start gap-2" title={field.hint}>
          <span
            aria-hidden
            className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", same ? "bg-transparent" : "bg-accent")}
          />
          <span className={cn("min-w-0", same ? "text-muted" : "font-medium text-ink")}>
            {field.label}
            {!same && <span className="sr-only"> (differs)</span>}
            {field.hint && <span className="mt-0.5 block text-xs font-normal text-subtle">{field.hint}</span>}
          </span>
        </span>
      }
    >
      {products.map((p, i) => {
        const isBest = best.includes(i);
        const isBool = field.type === "boolean";
        const yes = p.specs[field.key] === true;
        return (
          <ColumnCell key={p.slug} productName={p.name} className="text-[13px] leading-snug sm:text-sm">
            <span
              className={cn(
                "inline-flex max-w-full items-start gap-1.5 rounded-lg",
                isBest && "-mx-2 -my-1 bg-positive-soft px-2 py-1 font-medium text-positive",
                !isBest && (same ? "text-muted" : "text-ink"),
              )}
            >
              {isBool && !isBest && (yes ? <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : <Minus className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />)}
              <span className="min-w-0 break-words tnum">{values[i]}</span>
              {isBest && (
                <>
                  <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={3} aria-hidden />
                  <span className="sr-only">(best)</span>
                </>
              )}
            </span>
          </ColumnCell>
        );
      })}
    </ColumnRow>
  );
}
