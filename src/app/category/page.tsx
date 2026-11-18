import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buildCatalogEntries, categoryStats, montageEntries } from "@/components/catalog/listing";
import { CategoryMontage } from "@/components/catalog/category-montage";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { ScoreBadge } from "@/components/ui/score";
import { CATEGORIES } from "@/lib/categories";
import { getProducts, getSettings } from "@/lib/data";
import { formatINRCompact } from "@/lib/format";

export const metadata: Metadata = {
  title: "All categories",
  description: "Phones, laptops, TVs, headphones, tablets and monitors — scored, priced and ready to compare.",
  alternates: { canonical: "/category" },
};

export default async function CategoriesPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  const cards = CATEGORIES.map((category) => {
    const entries = buildCatalogEntries(
      products.filter((p) => p.category === category.slug),
      category,
      settings,
    );
    return { category, entries, stats: entries.length ? categoryStats(entries) : null, montage: montageEntries(entries) };
  });

  return (
    <Container className="pb-24 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Categories" }]} />
      <Reveal className="mt-8 max-w-2xl sm:mt-12">
        <p className="eyebrow mb-4">Explore categories</p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Choose the device you want to research.
        </h1>
        <p className="mt-5 text-lg text-muted">
          Every category has its own specification sheet, filters and scoring weights — so laptops are never judged on
          cameras, and headphones never on GPUs.
        </p>
      </Reveal>

      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ category, stats, montage }) => (
          <StaggerItem key={category.slug} className="h-full">
            <Link
              href={`/category/${category.slug}`}
              className="card card-hover group relative flex h-full flex-col overflow-hidden rounded-panel p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <CategoryIcon icon={category.icon} className="size-5" />
                </span>
                <ArrowUpRight
                  className="size-5 text-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink">{category.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{category.tagline}</p>

              <div className="relative mx-auto mt-6 w-full max-w-xs">
                <CategoryMontage category={category.slug} products={montage.map((e) => e.product)} />
              </div>

              {stats && (
                <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-5 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Products</dt>
                    <dd className="mt-1 font-semibold text-ink tnum">{stats.count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Price range</dt>
                    <dd className="mt-1 font-semibold text-ink tnum">
                      {formatINRCompact(stats.minPrice)}–{formatINRCompact(stats.maxPrice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Top pick</dt>
                    <dd className="mt-1">{stats.topPick && <ScoreBadge score={stats.topPick.score} size="sm" />}</dd>
                  </div>
                </dl>
              )}
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </Container>
  );
}
