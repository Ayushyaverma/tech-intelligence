"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/format";
import type { CatalogEntry, ViewMode } from "./catalog-query";

interface CatalogResultsProps {
  entries: CatalogEntry[];
  view: ViewMode;
  /** server-rendered <AdSlot>, or null when the slot is switched off */
  adSlot?: ReactNode;
  /** animate items in (false on first paint, so server HTML isn't faded out) */
  animateIn: boolean;
  /** plural noun for the empty state, e.g. "smartphones" */
  noun: string;
  onReset: () => void;
}

/** Sponsored card goes after this many products (R8: "between listings"). */
const AD_AFTER = 6;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Product grid / list with layout animations as filters change. */
export function CatalogResults({ entries, view, adSlot, animateIn, noun, onReset }: CatalogResultsProps) {
  const reduce = useReducedMotion();

  if (!entries.length) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No ${noun} match these filters`}
        description="Try widening the price range, removing a brand or clearing the search. Every filter shows how many products it would leave."
        action={
          <Button variant="ink" onClick={onReset}>
            <RotateCcw aria-hidden />
            Reset filters
          </Button>
        }
      />
    );
  }

  const adIndex = Math.min(AD_AFTER, entries.length) - 1;
  const enter = animateIn ? (reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }) : false;
  const layout = reduce ? false : ("position" as const);

  // A flat list of keyed items so AnimatePresence can animate each one out.
  const items: ReactNode[] = [];
  entries.forEach((e, i) => {
    items.push(
      <motion.li
        key={e.product.slug}
        layout={layout}
        initial={enter}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        transition={{ duration: reduce ? 0.01 : 0.32, ease: EASE, delay: animateIn && !reduce ? Math.min(i, 8) * 0.03 : 0 }}
        className="min-w-0"
      >
        <ProductCard product={e.product} score={e.score} variant={view === "grid" ? "grid" : "row"} priority={i < 3} />
      </motion.li>,
    );
    if (adSlot && i === adIndex) {
      items.push(
        <motion.li key="ad-slot" layout={layout} transition={{ duration: reduce ? 0.01 : 0.32, ease: EASE }} className="col-span-full">
          {adSlot}
        </motion.li>,
      );
    }
  });

  return (
    // keyed by view so switching grid ↔ list re-flows the whole list with a soft fade
    <ul
      key={view}
      className={cn("relative grid gap-4", view === "grid" ? "sm:grid-cols-2 sm:gap-5 xl:grid-cols-3" : "grid-cols-1")}
    >
      <AnimatePresence mode="popLayout" initial={animateIn}>
        {items}
      </AnimatePresence>
    </ul>
  );
}
