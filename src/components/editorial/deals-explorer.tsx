"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug } from "@/lib/types";
import { DealCard } from "./deal-card";
import type { DealData } from "./types";

type Sort = "percent" | "amount" | "score";

const SORTS: { value: Sort; label: string }[] = [
  { value: "percent", label: "Biggest drop" },
  { value: "amount", label: "Most saved" },
  { value: "score", label: "Top rated" },
];

/** Category chips, sort control and an animated grid of price drops. */
export function DealsExplorer({ deals }: { deals: DealData[] }) {
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [sort, setSort] = useState<Sort>("percent");
  const reduce = useReducedMotion();

  const categories = useMemo(
    () =>
      CATEGORIES.map((c) => ({ config: c, count: deals.filter((d) => d.category === c.slug).length })).filter(
        (c) => c.count > 0,
      ),
    [deals],
  );

  const visible = useMemo(() => {
    const list = category === "all" ? deals : deals.filter((d) => d.category === category);
    const by: Record<Sort, (a: DealData, b: DealData) => number> = {
      percent: (a, b) => a.percent - b.percent,
      amount: (a, b) => a.amount - b.amount,
      score: (a, b) => b.score - a.score,
    };
    return [...list].sort(by[sort]);
  }, [deals, category, sort]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter price drops by category"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Chip selected={category === "all"} onClick={() => setCategory("all")}>
            All
            <span className="tnum opacity-60">{deals.length}</span>
          </Chip>
          {categories.map(({ config, count }) => (
            <Chip key={config.slug} selected={category === config.slug} onClick={() => setCategory(config.slug)}>
              <CategoryIcon icon={config.icon} />
              {config.shortName}
              <span className="tnum opacity-60">{count}</span>
            </Chip>
          ))}
        </div>
        <Segmented options={SORTS} value={sort} onChange={setSort} label="Sort price drops" size="sm" />
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} price {visible.length === 1 ? "drop" : "drops"} shown
      </p>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={TrendingDown}
          title="No recorded drops here right now"
          description="Prices in this category have held steady over the last 30 days. Check back after the next price check."
        />
      ) : (
        <motion.ul layout={!reduce} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((d) => (
              <motion.li
                key={d.slug}
                layout={!reduce}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                transition={{ duration: reduce ? 0.01 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <DealCard deal={d} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
