import { ArrowDown, ArrowUp, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerItem, Stagger } from "@/components/ui/reveal";
import type { Benchmark, Product } from "@/lib/types";
import { cn } from "@/lib/format";
import { formatNumber } from "./helpers";

interface BenchmarkStat {
  bench: Benchmark;
  avg?: number;
  /** % better (+) or worse (−) than the category average, direction-aware */
  delta?: number;
  rank?: number;
  of: number;
  /** largest value seen in the category, for bar scaling */
  max: number;
}

/** Category average/rank per benchmark, from other published products that report the same test. */
function analyse(product: Product, peers: Product[]): BenchmarkStat[] {
  return product.benchmarks.map((bench) => {
    const others = peers
      .filter((p) => p.id !== product.id)
      .flatMap((p) => p.benchmarks.filter((b) => b.name === bench.name).map((b) => b.value));
    const all = [bench.value, ...others];
    const max = Math.max(...all);
    if (!others.length) return { bench, of: 1, max };
    const avg = others.reduce((a, b) => a + b, 0) / others.length;
    const raw = avg ? ((bench.value - avg) / avg) * 100 : 0;
    const delta = bench.higherIsBetter ? raw : -raw;
    const sorted = [...all].sort((a, b) => (bench.higherIsBetter ? b - a : a - b));
    return { bench, avg, delta, rank: sorted.indexOf(bench.value) + 1, of: all.length, max };
  });
}

function Bar({ value, max, className, label }: { value: number; max: number; className: string; label: string }) {
  const pct = max ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={label}>
      <div className={cn("h-full rounded-full", className)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Measured results vs the category average, as paired horizontal bars. */
export function Benchmarks({ product, peers, noun }: { product: Product; peers: Product[]; noun: string }) {
  if (!product.benchmarks.length) {
    return (
      <EmptyState
        icon={Gauge}
        title="No lab results yet"
        description="We publish benchmarks once a review unit has completed our standard test suite."
      />
    );
  }
  const stats = analyse(product, peers);

  return (
    <Stagger className="grid gap-4 md:grid-cols-2">
      {stats.map(({ bench, avg, delta, rank, of, max }) => {
        const unit = bench.unit ? ` ${bench.unit}` : "";
        const better = delta !== undefined && delta >= 0.5;
        const worse = delta !== undefined && delta <= -0.5;
        return (
          <StaggerItem key={bench.name} className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold tracking-tight text-ink">{bench.name}</h4>
                <p className="mt-0.5 text-xs text-subtle">{bench.higherIsBetter ? "Higher is better" : "Lower is better"}</p>
              </div>
              {rank !== undefined && (
                <Badge tone={rank === 1 ? "positive" : "neutral"}>
                  #{rank} of {of}
                </Badge>
              )}
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-tight text-ink tnum">
              {formatNumber(bench.value)}
              <span className="ml-1 text-sm font-medium text-muted">{bench.unit}</span>
            </p>

            <div className="mt-4 space-y-2.5">
              <div>
                <div className="mb-1 flex justify-between text-[11.5px] text-muted">
                  <span className="font-medium text-ink-2">This {noun}</span>
                  <span className="tnum">
                    {formatNumber(bench.value)}
                    {unit}
                  </span>
                </div>
                <Bar value={bench.value} max={max} className="bg-accent" label={`This product: ${formatNumber(bench.value)}${unit}`} />
              </div>
              {avg !== undefined && (
                <div>
                  <div className="mb-1 flex justify-between text-[11.5px] text-muted">
                    <span>Category average</span>
                    <span className="tnum">
                      {formatNumber(avg)}
                      {unit}
                    </span>
                  </div>
                  <Bar value={avg} max={max} className="bg-subtle/60" label={`Category average: ${formatNumber(avg)}${unit}`} />
                </div>
              )}
            </div>

            {delta !== undefined && (
              <p
                className={cn(
                  "mt-4 inline-flex items-center gap-1 text-xs font-medium",
                  better ? "text-positive" : worse ? "text-negative" : "text-muted",
                )}
              >
                {better ? <ArrowUp className="size-3.5" aria-hidden /> : worse ? <ArrowDown className="size-3.5" aria-hidden /> : null}
                {better || worse
                  ? `${Math.abs(delta).toFixed(0)}% ${better ? "better" : "worse"} than the average ${noun}`
                  : `In line with the average ${noun}`}
              </p>
            )}
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
