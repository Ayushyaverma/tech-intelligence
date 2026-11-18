"use client";

import { Check, ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import type { CategoryConfig, FilterDef } from "@/lib/types";
import { cn } from "@/lib/format";
import {
  minStepLabel,
  omit,
  toggleIn,
  withValues,
  type BudgetBucket,
  type CatalogQuery,
  type Facets,
  type FacetOption,
} from "./catalog-query";
import { PriceFilter } from "./price-filter";

export type QueryUpdate = (update: (q: CatalogQuery) => CatalogQuery) => void;

interface FilterPanelProps {
  category: CategoryConfig;
  query: CatalogQuery;
  facets: Facets;
  onChange: QueryUpdate;
  priceBounds: { min: number; max: number; step: number };
  budgetBuckets: BudgetBucket[];
  allPrices: number[];
}

/** Groups open by default; the rest start collapsed to keep the sidebar calm. */
const OPEN_BY_DEFAULT = 4;

/**
 * Filters built from the category config (`category.filters`), so every
 * category gets its own set — laptops never see camera filters.
 * Options with no variety in the catalogue are hidden unless already in use.
 */
export function FilterPanel({ category, query, facets, onChange, priceBounds, budgetBuckets, allPrices }: FilterPanelProps) {
  // Yes/no features share one "Features" group, placed where the first one appears in the config.
  const booleans = category.filters.filter((f) => f.kind === "boolean");
  const groups: { key: string; title: string; body: ReactNode; active: number }[] = [];
  for (const f of category.filters) {
    if (f.kind === "boolean") {
      if (f !== booleans[0]) continue;
      const features = renderFeatures();
      if (features) groups.push({ key: "features", title: booleans.length > 1 ? "Features" : f.label, ...features });
      continue;
    }
    const content = renderFilter(f);
    if (content) groups.push({ key: f.key, title: f.label, ...content });
  }

  function renderFilter(f: FilterDef): { body: ReactNode; active: number } | null {
    switch (f.kind) {
      case "price": {
        if (priceBounds.max <= priceBounds.min) return null;
        return {
          active: query.priceMin !== null || query.priceMax !== null ? 1 : 0,
          body: (
            <PriceFilter
              bounds={priceBounds}
              value={{ min: query.priceMin, max: query.priceMax }}
              onChange={(min, max) => onChange((q) => ({ ...q, priceMin: min, priceMax: max }))}
              buckets={budgetBuckets}
              pool={facets.pricePool}
              allPrices={allPrices}
            />
          ),
        };
      }
      case "brand": {
        if (facets.brands.length < 2 && !query.brands.length) return null;
        return {
          active: query.brands.length,
          body: (
            <CheckList
              options={facets.brands}
              selected={query.brands}
              onToggle={(v) => onChange((q) => ({ ...q, brands: toggleIn(q.brands, v) }))}
            />
          ),
        };
      }
      case "options": {
        const options = facets.options[f.key] ?? [];
        const selected = query.options[f.key] ?? [];
        if (options.length < 2 && !selected.length) return null;
        return {
          active: selected.length,
          body: (
            <CheckList
              options={options}
              selected={selected}
              onToggle={(v) =>
                onChange((q) => ({ ...q, options: withValues(q.options, f.key, toggleIn(q.options[f.key] ?? [], v)) }))
              }
            />
          ),
        };
      }
      case "min": {
        const counts = facets.mins[f.key] ?? {};
        const current = query.mins[f.key];
        return {
          active: current !== undefined ? 1 : 0,
          body: (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Minimum ${f.label}`}>
              <Chip
                selected={current === undefined}
                onClick={() => onChange((q) => ({ ...q, mins: omit(q.mins, f.key) }))}
                className="h-8 px-3 text-xs"
              >
                Any
              </Chip>
              {f.steps.map((step) => {
                const count = counts[step] ?? 0;
                const on = current === step;
                return (
                  <Chip
                    key={step}
                    selected={on}
                    disabled={!on && count === 0}
                    onClick={() =>
                      onChange((q) => ({ ...q, mins: on ? omit(q.mins, f.key) : { ...q.mins, [f.key]: step } }))
                    }
                    className="h-8 px-3 text-xs"
                    title={`${count} ${count === 1 ? "product" : "products"}`}
                  >
                    {minStepLabel(category, f.key, step)}
                  </Chip>
                );
              })}
            </div>
          ),
        };
      }
      case "boolean":
        return null; // grouped by renderFeatures()
    }
  }

  function renderFeatures(): { body: ReactNode; active: number } | null {
    const rows = booleans
      .map((f) => ({ f, on: query.flags.includes(f.key), count: facets.flags[f.key] ?? 0 }))
      .filter((r) => r.on || r.count > 0);
    if (!rows.length) return null;
    return {
      active: rows.filter((r) => r.on).length,
      body: (
        <ul className="space-y-1">
          {rows.map(({ f, on, count }) => (
            <li key={f.key} className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5">
              <Switch
                checked={on}
                onChange={() => onChange((q) => ({ ...q, flags: toggleIn(q.flags, f.key) }))}
                label={f.label}
              />
              <span className="text-xs text-subtle tnum">{count}</span>
            </li>
          ))}
        </ul>
      ),
    };
  }

  return (
    <div className="divide-y divide-line">
      {groups.map((g, i) => (
        <FilterGroup key={g.key} title={g.title} active={g.active} defaultOpen={i < OPEN_BY_DEFAULT}>
          {g.body}
        </FilterGroup>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function FilterGroup({
  title,
  active,
  defaultOpen,
  children,
}: {
  title: string;
  active: number;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || active > 0);
  const id = useId();
  return (
    <section className="py-3 first:pt-0 last:pb-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-2"
        >
          <span className="flex-1">{title}</span>
          {active > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink tnum">
              {active}
            </span>
          )}
          <ChevronDown
            aria-hidden
            className={cn("size-4 text-subtle transition-transform duration-200 group-hover:text-ink", open && "rotate-180")}
          />
        </button>
      </h3>
      {/* grid-rows 0fr→1fr animates height without measuring; `inert` keeps hidden controls out of tab order */}
      <div
        id={id}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-1 pt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {options.map((o) => {
        const checked = selected.includes(o.value);
        const disabled = !checked && o.count === 0;
        return (
          <li key={o.value}>
            <label
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors duration-150 hover:bg-surface-2",
                disabled && "cursor-default opacity-45 hover:bg-transparent",
              )}
            >
              <span className="relative grid size-[18px] shrink-0 place-items-center">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(o.value)}
                  className="peer size-[18px] cursor-pointer appearance-none rounded-[5px] bg-surface ring-1 ring-inset ring-line-strong transition-[background-color,box-shadow] duration-150 checked:bg-accent checked:ring-accent group-hover:ring-accent/50 disabled:cursor-default"
                />
                <Check
                  aria-hidden
                  strokeWidth={3}
                  className="pointer-events-none absolute size-3 text-accent-ink opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
                />
              </span>
              <span className={cn("min-w-0 flex-1 truncate text-sm", checked ? "font-medium text-ink" : "text-ink-2")}>
                {o.label}
              </span>
              <span className="text-xs text-subtle tnum">{o.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
