import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SCORE_TONE_CLASSES, ScoreBar } from "@/components/ui/score";
import { scoreLabel, scoreTone } from "@/lib/product-utils";
import type { Product, ScoreCriterion } from "@/lib/types";
import { cn } from "@/lib/format";
import { SCORE_TYPE_LABELS } from "./helpers";

interface ScoreBreakdownProps {
  product: Pick<Product, "subScores" | "scoreType">;
  /** effectiveCriteria(category, settings) — weights already normalised to 100 */
  criteria: ScoreCriterion[];
  score: number;
  categoryName: string;
  /** true when the admin has overridden the default weights */
  adjusted?: boolean;
}

/**
 * How the platform score is built: a 100-point strip where each segment is a
 * criterion's weight (filled by its sub-score), then each criterion's bar,
 * description and weighted contribution in points.
 */
export function ScoreBreakdown({ product, criteria, score, categoryName, adjusted }: ScoreBreakdownProps) {
  const rows = criteria
    .filter((c) => typeof product.subScores[c.key] === "number")
    .map((c) => {
      const value = product.subScores[c.key];
      return { ...c, value, points: (value * c.weight) / 100 };
    });

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-ink">Score breakdown</h3>
          <p className="mt-1 text-sm text-muted">
            {rows.length} weighted criteria for {categoryName.toLowerCase()}
            {adjusted ? " (weights adjusted by our editors)" : ""}
          </p>
        </div>
        <p className="text-right">
          <span className={cn("text-4xl font-semibold tracking-tight tnum", SCORE_TONE_CLASSES[scoreTone(score)].text)}>{score}</span>
          <span className="text-sm text-subtle">/100</span>
          <span className="block text-xs font-medium text-muted">{scoreLabel(score)}</span>
        </p>
      </div>

      {/* 100-point strip: segment width = weight, fill = sub-score */}
      <div className="mt-6 flex h-3 gap-1" aria-hidden>
        {rows.map((r) => (
          <div
            key={r.key}
            className="h-full overflow-hidden rounded-full bg-surface-2"
            style={{ width: `${r.weight}%` }}
            title={`${r.label}: ${r.value}/100 × ${r.weight}%`}
          >
            <div className={cn("h-full rounded-full", SCORE_TONE_CLASSES[scoreTone(r.value)].bar)} style={{ width: `${r.value}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 text-[10.5px] text-subtle" aria-hidden>
        {rows.map((r) => (
          <span key={r.key} className="truncate" style={{ width: `${r.weight}%` }}>
            {r.weight}%
          </span>
        ))}
      </div>

      <ul className="mt-7 space-y-5">
        {rows.map((r) => (
          <li key={r.key}>
            <ScoreBar label={r.label} value={r.value} weight={r.weight} />
            <div className="mt-1.5 flex items-start justify-between gap-4 text-xs">
              <p className="text-muted">{r.description}</p>
              <p className="shrink-0 font-medium text-ink-2 tnum">
                +{r.points.toFixed(1)} <span className="font-normal text-subtle">pts</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
        <p>
          <span className="font-medium text-ink-2">{SCORE_TYPE_LABELS[product.scoreType].label}.</span>{" "}
          {SCORE_TYPE_LABELS[product.scoreType].description}
        </p>
        <Link
          href="/methodology"
          className="group inline-flex items-center gap-1 rounded-full text-[13px] font-medium text-accent transition-colors duration-150 hover:text-accent-strong"
        >
          How we score
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
