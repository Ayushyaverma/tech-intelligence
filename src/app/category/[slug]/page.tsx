import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { CategoryHero } from "@/components/catalog/category-hero";
import { buildCatalogEntries, categoryStats, montageEntries } from "@/components/catalog/listing";
import { ProductCardSkeleton } from "@/components/product-card";
import { AdSlot } from "@/components/ui/ad-slot";
import { Container } from "@/components/ui/container";
import { CATEGORY_SLUGS, getCategory } from "@/lib/categories";
import { getProductsByCategory, getSettings } from "@/lib/data";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  const description = `Compare ${category.name.toLowerCase()} by platform score, verified price and specifications. ${category.tagline}`;
  return {
    title: `Best ${category.name} — scores, prices & specs`,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title: `${category.name} · Tech Intelligence`, description, url: `/category/${category.slug}` },
  };
}

async function CategoryPageContent({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const [products, settings] = await Promise.all([getProductsByCategory(category.slug), getSettings()]);
  const entries = buildCatalogEntries(products, category, settings);
  const stats = categoryStats(entries);

  return (
    <Container className="pb-24 pt-6 sm:pt-8">
      <CategoryHero category={category} stats={stats} montage={montageEntries(entries)} />
      <div className="mt-10 sm:mt-14">
        {/* useSearchParams inside the explorer needs a Suspense boundary; the fallback ships in the static shell */}
        <Suspense fallback={<ListingFallback />}>
          <CatalogExplorer
            category={category}
            entries={entries}
            adSlot={<AdSlot id="category-between-listings" />}
          />
        </Suspense>
      </div>
    </Container>
  );
}

function ListingFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10" aria-busy="true" aria-label="Loading products">
      <div className="hidden space-y-3 lg:block">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-10" />
        ))}
      </div>
      <div>
        <div className="skeleton mb-6 h-11" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The params-dependent content sits inside <Suspense> so Next can also prerender
 * this route's generic fallback shell (used for slugs added after the build and
 * when pages regenerate after an admin edit). Known slugs still prerender fully.
 */
export default function CategoryPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <CategoryPageContent params={params} />
    </Suspense>
  );
}

function RouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-56" />
      <div className="skeleton h-12 w-full max-w-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton aspect-[4/3] rounded-panel" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-24" />
          <div className="skeleton h-40" />
        </div>
      </div>
    </div>
  );
}
