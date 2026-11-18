"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Newspaper } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import type { NewsKind } from "@/lib/types";
import { NewsCard } from "./news-card";
import { NEWS_KINDS, NEWS_KIND_ORDER } from "./news-kind";
import type { ArticleCardData } from "./types";

type Filter = "all" | NewsKind;

interface NewsExplorerProps {
  articles: ArticleCardData[];
  /** slugs already shown above the grid: hidden under "All", still found by kind filters */
  pinned?: string[];
}

/** Kind filter chips + an animated card grid for /news. */
export function NewsExplorer({ articles, pinned = [] }: NewsExplorerProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useReducedMotion();

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, launch: 0, price: 0, industry: 0, review: 0 };
    for (const a of articles) {
      c[a.kind] += 1;
      if (!pinned.includes(a.slug)) c.all += 1;
    }
    return c;
  }, [articles, pinned]);

  const visible = articles.filter((a) => (filter === "all" ? !pinned.includes(a.slug) : a.kind === filter));
  const options: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    ...NEWS_KIND_ORDER.map((k) => ({ value: k, label: NEWS_KINDS[k].plural })),
  ];

  return (
    <div>
      <div
        role="group"
        aria-label="Filter stories by type"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {options.map((o) => (
          <Chip key={o.value} selected={filter === o.value} onClick={() => setFilter(o.value)}>
            {o.label}
            <span className="tnum opacity-60">{counts[o.value]}</span>
          </Chip>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "story" : "stories"} shown
      </p>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Newspaper}
          title="No stories of this type yet"
          description="New stories are added as they're verified. Try another filter."
        />
      ) : (
        <motion.ul layout={!reduce} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((a) => (
              <motion.li
                key={a.slug}
                layout={!reduce}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                transition={{ duration: reduce ? 0.01 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <NewsCard article={a} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
