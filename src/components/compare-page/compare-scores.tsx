"use client";

import { Check, Gauge } from "lucide-react";
import { ScoreBadge } from "@/components/ui/score";
import type { ScoreCriterion } from "@/lib/types";
import { cn } from "@/lib/format";
import { ColumnCell, ColumnRow, ColumnScroller } from "./compare-grid";
import { CompareSection } from "./compare-section";
import { bestOf } from "./compare-logic";
import type { CompareProduct } from "./types";

interface CompareScoresProps {
  products: CompareProduct[];
  criteria: ScoreCriterion[];
}

/** Per-criterion sub-scores as bars, with the leader in each row highlighted. */
export function CompareScores({ products, criteria }: CompareScoresProps) {
  const overallBest = bestOf(products.map((p) => p.score));

  return (
    <CompareSection
      id="scores"
      icon={Gauge}
      title="Score breakdown"
      description="Each criterion is scored 0–100 and weighted into the platform score. Weights are shown beside each label."
    >
      <ColumnScroller>
        <div className="divide-y divide-line">
          <ColumnRow
            ariaLabel="Platform score"
            label={
              <span className="block">
                <span className="block font-semibold text-ink">Platform score</span>
                <span className="block text-xs text-muted">Weighted total</span>
              </span>
            }
          >
            {products.map((p, i) => (
              <ColumnCell key={p.slug} productName={p.name} className="flex items-center gap-2">
                <ScoreBadge score={p.score} size="md" />
                {overallBest.includes(i) && <LeaderMark />}
              </ColumnCell>
            ))}
          </ColumnRow>

          {criteria.map((c) => {
            const values = products.map((p) => p.subScores[c.key] ?? 0);
            const best = bestOf(values);
            return (
              <ColumnRow
                key={c.key}
                ariaLabel={c.label}
                label={
                  <span className="block" title={c.description}>
                    <span className="block font-medium text-ink">{c.label}</span>
                    <span className="block text-xs text-subtle tnum">{c.weight}% of score</span>
                  </span>
                }
              >
                {products.map((p, i) => (
                  <ColumnCell key={p.slug} productName={p.name}>
                    <ScoreCellBar value={values[i]} best={best.includes(i)} />
                  </ColumnCell>
                ))}
              </ColumnRow>
            );
          })}
        </div>
      </ColumnScroller>
    </CompareSection>
  );
}

function LeaderMark() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-semibold text-positive">
      <Check className="size-3" strokeWidth={3} aria-hidden />
      Leader
    </span>
  );
}

function ScoreCellBar({ value, best }: { value: number; best: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={cn("text-[15px] font-semibold tnum", best ? "text-positive" : "text-ink")}>{value}</span>
        {best && (
          <>
            <Check className="size-3.5 text-positive" strokeWidth={3} aria-hidden />
            <span className="sr-only">(best)</span>
          </>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", best ? "bg-positive" : "bg-accent/45")}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
