"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, GitCompareArrows, Plus } from "lucide-react";
import { COMPARE_MAX, useCompare } from "@/components/compare/compare-provider";
import { DeviceArt } from "@/components/device-art";
import { Button, ButtonLink } from "@/components/ui/button";
import { requireCategory } from "@/lib/categories";
import { compareHref } from "@/lib/product-utils";
import type { CategoryConfig } from "@/lib/types";
import { cn } from "@/lib/format";
import { pluralNoun } from "./catalog-query";

/**
 * "Compare your selection" card under the listing: shows x/5 picked from this
 * category and links to the comparison. If the saved selection belongs to a
 * different category it explains that comparisons stay within one category.
 */
export function CompareHelper({ category }: { category: CategoryConfig }) {
  const { items, count, category: selected, clear } = useCompare();
  const reduce = useReducedMotion();
  const foreign = selected !== null && selected !== category.slug;
  const ready = !foreign && count >= 2;
  const noun = pluralNoun(category);

  return (
    <section
      aria-labelledby="compare-helper-title"
      className="relative mt-12 overflow-hidden rounded-panel border border-line bg-surface p-5 shadow-sm sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(50% 120% at 100% 0%, var(--accent-soft), transparent 70%)" }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-bg shadow-md">
            <GitCompareArrows className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="compare-helper-title" className="text-lg font-semibold tracking-tight text-ink">
              Compare your selection
            </h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted" aria-live="polite">
              {foreign ? (
                <>
                  Your comparison holds {pluralNoun(requireCategory(selected))}. Comparisons stay within one
                  category, so clear it to start comparing {noun}.
                </>
              ) : count === 0 ? (
                <>Tick “Compare” on two to five {noun} to see specs, scores and price history side by side.</>
              ) : count === 1 ? (
                <>One selected — add at least one more to compare.</>
              ) : (
                <>
                  {count} of {COMPARE_MAX} selected. Differences are highlighted and a winner picked for each need.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {/* five slots: device thumbnails for picks, dashed placeholders for the rest */}
          <ol className="flex items-center gap-1.5" aria-label={`${foreign ? 0 : count} of ${COMPARE_MAX} selected`}>
            {Array.from({ length: COMPARE_MAX }, (_, i) => {
              const item = foreign ? undefined : items[i];
              return (
                <li
                  key={i}
                  className={cn(
                    "relative grid size-11 place-items-center overflow-hidden rounded-xl",
                    item ? "bg-surface-2 ring-1 ring-line" : "border border-dashed border-line-strong text-subtle",
                  )}
                  title={item ? item.name : undefined}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {item ? (
                      <motion.span
                        key={item.slug}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0.01 : 0.2 }}
                        className="block w-[120%]"
                      >
                        <DeviceArt
                          category={item.category}
                          primary={item.art.primary}
                          accent={item.art.accent}
                          variant={item.variant}
                        />
                      </motion.span>
                    ) : (
                      <Plus key="empty" className="size-3.5" aria-hidden />
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
          <span className="text-sm font-semibold text-ink tnum" aria-hidden>
            {foreign ? 0 : count}/{COMPARE_MAX}
          </span>

          {foreign ? (
            <Button variant="glass" onClick={clear}>
              Clear selection
            </Button>
          ) : ready ? (
            <ButtonLink href={compareHref(items.map((i) => i.slug))} variant="ink">
              Compare {count}
              <ArrowRight aria-hidden />
            </ButtonLink>
          ) : (
            <Button variant="ink" disabled>
              Compare
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
