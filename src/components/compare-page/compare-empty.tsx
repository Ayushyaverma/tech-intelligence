"use client";

import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { DeviceArt } from "@/components/device-art";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { ScoreBadge } from "@/components/ui/score";
import { CATEGORIES, requireCategory } from "@/lib/categories";
import { compareHref } from "@/lib/product-utils";
import type { CategorySlug } from "@/lib/types";
import type { TrendingCard } from "./types";

interface CompareEmptyProps {
  trending: TrendingCard[];
  onStart: (category: CategorySlug) => void;
}

/** Nothing selected yet: explain the feature, start from a category, or open a popular match-up. */
export function CompareEmpty({ trending, onStart }: CompareEmptyProps) {
  return (
    <div className="pb-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <GitCompareArrows className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Compare up to five devices side by side.
        </h1>
        <p className="mt-5 text-lg text-muted">
          Scores, specifications, prices and price history in one view — with the differences highlighted and a clear
          “best for” verdict for each kind of buyer.
        </p>
      </Reveal>

      <section aria-labelledby="start-title" className="mt-14">
        <h2 id="start-title" className="eyebrow mb-4 text-center">
          Start with a category
        </h2>
        <Stagger className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <StaggerItem key={c.slug}>
              <button
                type="button"
                onClick={() => onStart(c.slug)}
                className="btn-glass flex w-full flex-col items-center gap-2 rounded-card px-4 py-5 text-sm font-medium text-ink"
              >
                <CategoryIcon icon={c.icon} className="size-5 text-accent" />
                {c.name}
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {trending.length > 0 && (
        <section aria-labelledby="trending-title" className="mt-20">
          <h2 id="trending-title" className="text-2xl font-semibold tracking-tight text-ink">
            Popular comparisons
          </h2>
          <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((t) => (
              <StaggerItem key={t.id} className="h-full">
                <Link
                  href={compareHref(t.products.map((p) => p.slug))}
                  className="card card-hover group flex h-full flex-col p-5"
                >
                  <div className="flex -space-x-5">
                    {t.products.slice(0, 4).map((p) => (
                      <span
                        key={p.slug}
                        className="grid size-16 place-items-center rounded-2xl bg-surface-2 p-2 ring-4 ring-surface"
                      >
                        <DeviceArt
                          category={p.item.category}
                          primary={p.item.art.primary}
                          accent={p.item.art.accent}
                          variant={p.item.variant}
                          className="h-full w-full"
                        />
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted">{requireCategory(t.category).name}</p>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">{t.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.products.map((p) => (
                      <ScoreBadge key={p.slug} score={p.score} size="sm" />
                    ))}
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent">
                    Compare <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}
