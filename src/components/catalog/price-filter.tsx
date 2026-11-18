"use client";

import { Chip } from "@/components/ui/chip";
import { cn, formatINR, formatINRCompact } from "@/lib/format";
import type { BudgetBucket } from "./catalog-query";
import { useDraft } from "./use-draft";

type Range = [number, number];

interface PriceFilterProps {
  bounds: { min: number; max: number; step: number };
  /** null = open-ended on that side */
  value: { min: number | null; max: number | null };
  onChange: (min: number | null, max: number | null) => void;
  buckets: BudgetBucket[];
  /** prices of products passing the other filters, for the little histogram */
  pool: number[];
  /** every product price in the category, so the histogram scale stays stable */
  allPrices: number[];
}

const BINS = 18;

/* Native range inputs restyled: transparent track, white glassy thumbs, thumbs-only pointer events
   so the two inputs can overlap. The global :focus-visible outline is replaced by a thumb ring. */
const THUMB =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(16,18,24,0.25),0_0_0_1px_rgba(16,18,24,0.08)] [&::-webkit-slider-thumb]:transition-[box-shadow,transform] [&::-webkit-slider-thumb]:duration-150 active:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:cursor-grabbing focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--accent-soft),0_0_0_1.5px_var(--accent)] " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(16,18,24,0.25),0_0_0_1px_rgba(16,18,24,0.08)] focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_4px_var(--accent-soft),0_0_0_1.5px_var(--accent)] " +
  "[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent";

/** Dual-thumb price slider with a price histogram, read-outs and quick budget chips. */
export function PriceFilter({ bounds, value, onChange, buckets, pool, allPrices }: PriceFilterProps) {
  const committed: Range = [value.min ?? bounds.min, value.max ?? bounds.max];
  const [range, setRange, flush] = useDraft<Range>(
    committed,
    ([lo, hi]) => onChange(lo <= bounds.min ? null : lo, hi >= bounds.max ? null : hi),
    { delay: 300, equal: sameRange },
  );
  const [lo, hi] = range;
  const span = bounds.max - bounds.min || 1;
  const pct = (v: number) => ((v - bounds.min) / span) * 100;

  if (bounds.max <= bounds.min) return null;

  const bins = histogram(allPrices, pool, bounds);
  const tallest = Math.max(1, ...bins.map((b) => b.total));

  return (
    <div className="space-y-4">
      {/* histogram: how products are spread across the price range */}
      <div aria-hidden className="flex h-10 items-end gap-[3px] px-2.5">
        {bins.map((b, i) => {
          const mid = bounds.min + ((i + 0.5) / BINS) * span;
          const inside = mid >= lo && mid <= hi;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-[3px] transition-colors duration-200",
                b.total === 0 ? "bg-surface-2" : inside && b.matching > 0 ? "bg-accent/70" : "bg-surface-3",
              )}
              style={{ height: `${b.total ? 18 + (b.total / tallest) * 82 : 8}%` }}
            />
          );
        })}
      </div>

      <div className="relative h-5 px-2.5">
        <div className="absolute inset-x-2.5 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-3" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          // thumb centres travel from 0.625rem to (100% − 0.625rem), so map the fill onto that span
          style={{
            left: `calc(0.625rem + (100% - 1.25rem) * ${pct(lo) / 100})`,
            width: `calc((100% - 1.25rem) * ${(pct(hi) - pct(lo)) / 100})`,
          }}
        />
        {(["min", "max"] as const).map((side) => {
          const isMin = side === "min";
          const v = isMin ? lo : hi;
          return (
            <input
              key={side}
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={bounds.step}
              value={v}
              aria-label={isMin ? "Minimum price" : "Maximum price"}
              aria-valuetext={formatINR(v)}
              onChange={(e) => {
                const n = Number(e.target.value);
                setRange(isMin ? [Math.min(n, hi - bounds.step), hi] : [lo, Math.max(n, lo + bounds.step)]);
              }}
              onPointerUp={() => flush()}
              onKeyUp={() => flush()}
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent",
                THUMB,
                // the min thumb must stay grabbable when both thumbs meet at the top end
                isMin && lo > bounds.max - span * 0.1 ? "z-20" : "z-10",
              )}
              style={{ outline: "none" }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <ReadOut label="Min" value={lo} />
        <span className="h-px w-3 bg-line-strong" aria-hidden />
        <ReadOut label="Max" value={hi} plus={hi >= bounds.max} />
      </div>

      {buckets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {buckets.map((b) => {
            const selected = value.min === b.min && value.max === b.max;
            return (
              <Chip
                key={b.label}
                selected={selected}
                onClick={() => (selected ? onChange(null, null) : onChange(b.min, b.max))}
                className="h-8 px-3 text-xs"
              >
                {b.label}
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReadOut({ label, value, plus }: { label: string; value: number; plus?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-surface-2/70 px-3 py-1.5 ring-1 ring-inset ring-line">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-subtle">{label}</p>
      <p className="truncate font-semibold text-ink tnum" title={formatINR(value)}>
        {formatINRCompact(value)}
        {plus ? "+" : ""}
      </p>
    </div>
  );
}

function sameRange(a: Range, b: Range) {
  return a[0] === b[0] && a[1] === b[1];
}

function histogram(all: number[], pool: number[], bounds: { min: number; max: number }) {
  const span = bounds.max - bounds.min || 1;
  const bin = (p: number) => Math.min(BINS - 1, Math.max(0, Math.floor(((p - bounds.min) / span) * BINS)));
  const bins = Array.from({ length: BINS }, () => ({ total: 0, matching: 0 }));
  all.forEach((p) => bins[bin(p)].total++);
  pool.forEach((p) => bins[bin(p)].matching++);
  return bins;
}
