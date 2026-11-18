import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { ScoreRing } from "@/components/ui/score";
import { requireCategory } from "@/lib/categories";
import { currentPrice, productHref, scoreLabel } from "@/lib/product-utils";
import type { Product, ScoreType } from "@/lib/types";
import { HomeSection } from "./home-section";
import { RADIUS, shortDate } from "./home-utils";
import { ProductThumb } from "./product-thumb";

const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  editorial: "Editorial score",
  aggregate: "Multi-source score",
  benchmark: "Benchmark score",
};

export interface ReviewCardData {
  product: Product;
  score: number;
}

/** Section 9: the best-scoring device in each category, with a reviewer's verdict. */
export function LatestReviews({ items }: { items: ReviewCardData[] }) {
  return (
    <HomeSection
      id="reviews"
      header={{
        eyebrow: "Latest reviews",
        title: "Top-rated right now",
        description: "The highest-scoring device in each category, and what independent reviewers said about it.",
        action: { href: "/methodology", label: "How we score" },
      }}
    >
      {items.length ? (
        <Stagger as="ul" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <StaggerItem as="li" key={item.product.slug}>
              <ReviewCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Scored products will show up here once they're published."
          action={{ href: "/category", label: "Browse categories" }}
        />
      )}
    </HomeSection>
  );
}

function ReviewCard({ item: { product, score } }: { item: ReviewCardData }) {
  const category = requireCategory(product.category);
  const review = product.reviews[0];
  return (
    <Link
      href={productHref(product)}
      style={RADIUS.card}
      className="card card-hover group flex h-full flex-col p-5 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <ScoreRing score={score} size={68} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{category.shortName}</p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-ink transition-colors duration-150 group-hover:text-accent">
            {product.name}
          </h3>
          <p className="text-[13px] text-muted">
            {scoreLabel(score)} · {SCORE_TYPE_LABELS[product.scoreType]}
          </p>
        </div>
        <span className="hidden sm:block">
          <ProductThumb product={product} className="size-14" />
        </span>
      </div>

      {review ? (
        <figure className="mt-5 flex-1 rounded-xl bg-surface-2/70 p-4 ring-1 ring-line">
          <Quote className="size-4 text-accent" aria-hidden />
          <blockquote className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-ink-2">{review.summary}</blockquote>
          <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-medium text-ink-2">{review.publisher}</span>
            {review.rating !== undefined && (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span className="tnum">{review.rating}/10</span>
              </>
            )}
            <span aria-hidden className="text-subtle">
              ·
            </span>
            <time dateTime={review.date} className="tnum">
              {shortDate(review.date)}
            </time>
          </figcaption>
        </figure>
      ) : (
        <p className="mt-5 flex-1 text-sm leading-relaxed text-muted">{product.summary}</p>
      )}

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="text-[11px] text-muted">Best price</p>
          <Price value={currentPrice(product)} size="md" />
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
          Full review
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
