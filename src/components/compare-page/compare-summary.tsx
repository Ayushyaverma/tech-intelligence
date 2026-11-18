"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BadgeIndianRupee, LayoutGrid, ShieldAlert, Tag, Trophy, type LucideIcon } from "lucide-react";
import { ProductVisual } from "@/components/product-visual";
import { TIER_LABELS } from "@/components/product-card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score";
import { scoreLabel } from "@/lib/product-utils";
import type { CategoryConfig, ScoreType } from "@/lib/types";
import { ColumnRow, ColumnScroller } from "./compare-grid";
import { CompareSection } from "./compare-section";
import { HIGHLIGHT_LABELS, highlights, type Highlight, type NeedVerdict } from "./compare-logic";
import type { CompareProduct } from "./types";

const HIGHLIGHT_STYLE: Record<Highlight, { icon: LucideIcon; tone: BadgeTone }> = {
  "top-score": { icon: Trophy, tone: "accent" },
  "lowest-price": { icon: Tag, tone: "positive" },
  "best-value": { icon: BadgeIndianRupee, tone: "positive" },
};

export const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  editorial: "Editorial score",
  aggregate: "Multi-source aggregate",
  benchmark: "Benchmark-derived",
};

interface CompareSummaryProps {
  products: CompareProduct[];
  category: CategoryConfig;
  verdicts: NeedVerdict[];
}

/** "At a glance": large visual, score ring and headline badges per product. */
export function CompareSummary({ products, category, verdicts }: CompareSummaryProps) {
  const reduce = useReducedMotion();
  const badges = highlights(products);

  return (
    <CompareSection
      id="overview"
      icon={LayoutGrid}
      title="At a glance"
      description={`Platform scores out of 100, weighted for ${category.name.toLowerCase()}.`}
      actions={
        <Link
          href="/methodology"
          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
        >
          How we score
        </Link>
      }
    >
      <ColumnScroller>
        <ColumnRow
          ariaLabel="Overview"
          labelClassName="bg-surface py-5 pr-3"
          label={
            <div className="space-y-3">
              <p className="font-semibold text-ink">Overview</p>
              <p className="hidden text-xs leading-relaxed text-muted sm:block">
                Badges compare only the products on this page. Scores never include advertising.
              </p>
            </div>
          }
        >
          <AnimatePresence initial={false} mode="popLayout">
            {products.map((p, i) => {
              const wins = verdicts.filter((v) => v.winners.length === 1 && v.winners[0].slug === p.slug);
              return (
                <motion.div
                  key={p.slug}
                  layout={!reduce}
                  initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
                  transition={{ duration: reduce ? 0.01 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="min-w-0 snap-start px-2 py-5 sm:px-3"
                >
                  <span className="sr-only">{p.name}: </span>
                  <ProductVisual product={p} size="md" labelled={false} className="mx-auto max-w-[17rem]" />
                  <div className="mt-4 flex items-center gap-3">
                    <ScoreRing score={p.score} size={60} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{scoreLabel(p.score)}</p>
                      <p className="truncate text-xs text-muted">{SCORE_TYPE_LABELS[p.scoreType]}</p>
                      <p className="truncate text-xs text-subtle">{TIER_LABELS[p.tier]}</p>
                    </div>
                  </div>
                  {(badges[i].length > 0 || !p.verified) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {badges[i].map((h) => {
                        const { icon: Icon, tone } = HIGHLIGHT_STYLE[h];
                        return (
                          <Badge key={h} tone={tone}>
                            <Icon aria-hidden />
                            {HIGHLIGHT_LABELS[h]}
                          </Badge>
                        );
                      })}
                      {!p.verified && (
                        <Badge tone="warning">
                          <ShieldAlert aria-hidden />
                          Awaiting verification
                        </Badge>
                      )}
                    </div>
                  )}
                  {wins.length > 0 && (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      Best for <span className="font-medium text-ink-2">{wins.map((w) => w.label).join(", ")}</span>
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ColumnRow>
      </ColumnScroller>
    </CompareSection>
  );
}
