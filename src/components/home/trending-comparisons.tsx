import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { ScoreBadge } from "@/components/ui/score";
import { requireCategory } from "@/lib/categories";
import { compareHref } from "@/lib/product-utils";
import type { Product, TrendingComparison } from "@/lib/types";
import { HomeSection } from "./home-section";
import { RADIUS } from "./home-utils";
import { ProductStack } from "./product-thumb";

export interface ComparisonCardData {
  comparison: TrendingComparison;
  products: { product: Product; score: number }[];
}

/** Section 6: popular match-ups, each opening the comparison page pre-filled. */
export function TrendingComparisons({ items }: { items: ComparisonCardData[] }) {
  return (
    <HomeSection
      id="comparisons"
      header={{
        eyebrow: "Trending comparisons",
        title: "Popular match-ups",
        description: "Compare up to five devices side by side — specs, scores and price history on one screen.",
        action: { href: "/compare", label: "Build your own" },
      }}
    >
      {items.length ? (
        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <StaggerItem as="li" key={item.comparison.id}>
              <ComparisonCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState
          icon={GitCompareArrows}
          title="No match-ups yet"
          description="Pick two to five devices from any category and line them up yourself."
          action={{ href: "/compare", label: "Start a comparison" }}
        />
      )}
    </HomeSection>
  );
}

function ComparisonCard({ item: { comparison, products } }: { item: ComparisonCardData }) {
  const category = requireCategory(comparison.category);
  return (
    <Link
      href={compareHref(products.map((p) => p.product.slug))}
      style={RADIUS.card}
      className="card card-hover group flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <ProductStack products={products.map((p) => p.product)} itemClassName="size-14" />
        <Badge>{category.shortName}</Badge>
      </div>

      <h3 className="mt-5 text-base font-semibold leading-snug tracking-tight text-ink">
        {products.map((p, i) => (
          <Fragment key={p.product.slug}>
            {i > 0 && <span className="font-normal text-subtle"> vs </span>}
            {p.product.name}
          </Fragment>
        ))}
      </h3>

      <ul className="mt-4 space-y-2 border-t border-line pt-4">
        {products.map(({ product, score }) => (
          <li key={product.slug} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-ink-2">{product.name}</span>
            <ScoreBadge score={score} size="sm" />
          </li>
        ))}
      </ul>

      <span className="mt-auto flex items-center justify-between pt-5 text-sm">
        <span className="text-muted">{products.length} devices</span>
        <span className="inline-flex items-center gap-1 font-medium text-accent">
          Compare
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  );
}
