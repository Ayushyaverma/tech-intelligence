import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Gauge, IndianRupee, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ScoreBadge } from "@/components/ui/score";
import { productHref } from "@/lib/product-utils";
import type { CategoryConfig } from "@/lib/types";
import { formatINRCompact } from "@/lib/format";
import { CategoryMontage } from "./category-montage";
import type { CatalogEntry } from "./catalog-query";
import { formatCheckedDate, type CategoryStats } from "./listing";

interface CategoryHeroProps {
  category: CategoryConfig;
  stats: CategoryStats;
  montage: CatalogEntry[];
}

/** Page header for /category/[slug]: breadcrumbs, title, summary stats and a device still-life. */
export function CategoryHero({ category, stats, montage }: CategoryHeroProps) {
  const glow = montage[0]?.product.art.accent ?? "#4f5bd5";
  return (
    <header>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/category", label: "Categories" },
          { label: category.name },
        ]}
      />

      <div className="relative mt-4 overflow-hidden rounded-hero border border-line bg-surface shadow-sm">
        {/* soft colour wash picked up from the top product */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(55% 90% at 88% 20%, color-mix(in oklab, ${glow} 16%, transparent), transparent 70%), radial-gradient(40% 60% at 0% 100%, var(--accent-soft), transparent 70%)`,
          }}
        />
        <div className="relative grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 lg:p-12">
          <div className="min-w-0 animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-surface-2/80 py-1 pl-1 pr-3 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line">
              <span className="grid size-6 place-items-center rounded-full bg-surface text-accent shadow-xs ring-1 ring-line">
                <CategoryIcon icon={category.icon} className="size-3.5" />
              </span>
              <span className="tnum">
                {stats.count} {stats.count === 1 ? "product" : "products"} · {stats.brandCount}{" "}
                {stats.brandCount === 1 ? "brand" : "brands"}
              </span>
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-2">{category.tagline}</p>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
              Explore products, evaluate scores and compare your favourites.
            </p>

            {stats.count > 0 && (
              <dl className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
                <Stat icon={<IndianRupee />} label="Price range">
                  <span className="tnum">
                    {formatINRCompact(stats.minPrice)} – {formatINRCompact(stats.maxPrice)}
                  </span>
                </Stat>
                <Stat icon={<Gauge />} label="Average score">
                  <span className="tnum">{stats.avgScore}</span>
                  <span className="text-sm font-normal text-subtle">/100</span>
                </Stat>
                {stats.topBrand && (
                  <Stat icon={<Trophy />} label="Top-rated brand">
                    <span className="truncate">{stats.topBrand.name}</span>
                    <span className="text-sm font-normal text-subtle tnum">avg {stats.topBrand.avgScore}</span>
                  </Stat>
                )}
              </dl>
            )}

            {stats.lastChecked && (
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted">
                <BadgeCheck className="size-3.5 text-positive" aria-hidden />
                Prices last checked {formatCheckedDate(stats.lastChecked)} · sample data for illustration
              </p>
            )}
          </div>

          {montage.length > 0 && (
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <CategoryMontage category={category.slug} products={montage.map((e) => e.product)} />
              {stats.topPick && <TopPick entry={stats.topPick} />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-card bg-surface/70 p-3.5 ring-1 ring-inset ring-line backdrop-blur-sm">
      <dt className="flex items-center gap-1.5 text-xs text-muted [&_svg]:size-3.5 [&_svg]:text-subtle">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-1.5 text-lg font-semibold tracking-tight text-ink">{children}</dd>
    </div>
  );
}

/** Floating glass chip over the montage linking to the best-scoring product. */
function TopPick({ entry }: { entry: CatalogEntry }) {
  return (
    <Link
      href={productHref(entry.product)}
      className="glass group absolute bottom-1 right-1 z-30 flex max-w-[16rem] items-center gap-3 rounded-2xl py-2 pl-2 pr-3 transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] sm:bottom-3 sm:right-3"
    >
      <ScoreBadge score={entry.score} size="md" />
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Top pick</span>
        <span className="flex items-center gap-1 truncate text-sm font-semibold text-ink">
          <span className="truncate">{entry.product.name}</span>
          <ArrowUpRight
            className="size-3.5 shrink-0 text-subtle transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-ink"
            aria-hidden
          />
        </span>
      </span>
    </Link>
  );
}
