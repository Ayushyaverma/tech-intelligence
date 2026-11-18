import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCategory } from "@/lib/categories";
import { currentPrice, formatSpec, priceChange, productHref, specField } from "@/lib/product-utils";
import type { CategoryConfig, Product, Tier } from "@/lib/types";
import { cn } from "@/lib/format";
import { CompareToggle } from "./compare/compare-toggle";
import { toCompareItem } from "./compare/compare-item";
import { ProductVisual } from "./product-visual";
import { Badge } from "./ui/badge";
import { Price, PriceChange } from "./ui/price";
import { ScoreBadge } from "./ui/score";
import { Skeleton } from "./ui/skeleton";
import { Sparkline } from "./ui/sparkline";

export const TIER_LABELS: Record<Tier, string> = {
  flagship: "Flagship",
  "upper-mid": "Upper mid-range",
  "mid-range": "Mid-range",
  budget: "Budget",
};

interface ProductCardProps {
  product: Product;
  /** platform score, computed by the page with computeScore(product, settings) */
  score: number;
  variant?: "grid" | "compact" | "row";
  /** position in a ranked list (1-based) */
  rank?: number;
  /** eager-load the image (first cards above the fold) */
  priority?: boolean;
  className?: string;
}

/** Card shell: lifts on hover and shows a focus ring when its stretched link is focused. */
const SHELL =
  "group relative card card-hover has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent";

/** The product name link; its ::after covers the whole card so the card is one big target. */
function NameLink({ product, className }: { product: Product; className?: string }) {
  return (
    <Link
      href={productHref(product)}
      data-stretched
      className={cn("outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-['']", className)}
    >
      {product.name}
    </Link>
  );
}

function specRows(product: Product, category: CategoryConfig, extra = 0) {
  const keys = [...category.keySpecs];
  if (extra) {
    for (const s of category.specs) {
      if (keys.length >= category.keySpecs.length + extra) break;
      if (!keys.includes(s.key) && product.specs[s.key] !== undefined && s.type !== "boolean") keys.push(s.key);
    }
  }
  return keys.map((key) => {
    const field = specField(category, key);
    return { key, label: field?.label ?? key, value: formatSpec(field, product.specs[key]) };
  });
}

function RankBadge({ rank, className }: { rank: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-bg shadow-sm tnum",
        className,
      )}
    >
      <span className="sr-only">Rank </span>
      {rank}
    </span>
  );
}

export function ProductCard({ product, score, variant = "grid", rank, priority, className }: ProductCardProps) {
  const category = requireCategory(product.category);
  const price = currentPrice(product);
  const change = priceChange(product, 30);
  const trend = product.priceHistory.slice(-16).map((p) => p.price);
  const item = toCompareItem(product);

  if (variant === "compact") {
    return (
      <article data-testid="product-card" className={cn(SHELL, "flex items-center gap-3 p-2 pr-3.5", className)}>
        {rank !== undefined && <RankBadge rank={rank} className="ml-1 size-6 text-[11px]" />}
        <ProductVisual
          product={product}
          size="sm"
          labelled={false}
          priority={priority}
          className="w-20 shrink-0 sm:w-24"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{product.brand}</p>
          <h3 className="truncate text-sm font-semibold tracking-tight text-ink">
            <NameLink product={product} />
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Price value={price} size="sm" />
            <PriceChange percent={change.percent} size="sm" />
          </div>
        </div>
        <ScoreBadge score={score} size="sm" />
      </article>
    );
  }

  if (variant === "row") {
    const rows = specRows(product, category, 2);
    return (
      <article
        data-testid="product-card"
        className={cn(SHELL, "grid gap-4 p-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-4", className)}
      >
        <div className="relative">
          <ProductVisual
            product={product}
            labelled={false}
            priority={priority}
            className="[&_svg]:transition-transform [&_svg]:duration-300 group-hover:[&_svg]:scale-[1.03]"
          />
          {rank !== undefined && <RankBadge rank={rank} className="absolute left-2.5 top-2.5" />}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{product.brand}</span>
            <Badge>{TIER_LABELS[product.tier]}</Badge>
          </div>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-ink sm:text-xl">
            <NameLink product={product} />
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{product.tagline}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-sm lg:grid-cols-3">
            {rows.map((r) => (
              <div key={r.key} className="min-w-0">
                <dt className="text-xs text-subtle">{r.label}</dt>
                <dd className="truncate font-medium text-ink-2" title={r.value}>
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-t border-line pt-3 sm:w-48 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <ScoreBadge score={score} size="md" showLabel />
          <div className="text-left sm:text-right">
            <p className="text-[11px] text-subtle">Best price</p>
            <Price value={price} size="lg" />
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              <PriceChange percent={change.percent} size="sm" />
              <Sparkline points={trend} width={64} height={22} />
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <CompareToggle item={item} />
            <span className="hidden items-center gap-1 text-xs font-medium text-accent sm:inline-flex" aria-hidden>
              Details <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  const rows = specRows(product, category);
  return (
    <article data-testid="product-card" className={cn(SHELL, "flex h-full flex-col p-2", className)}>
      <div className="relative">
        <ProductVisual
          product={product}
          labelled={false}
          priority={priority}
          className="rounded-[12px] [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out group-hover:[&_svg]:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {rank !== undefined && <RankBadge rank={rank} />}
            <Badge className="bg-surface/80 backdrop-blur-sm">{TIER_LABELS[product.tier]}</Badge>
          </div>
          <CompareToggle item={item} className="pointer-events-auto relative z-10" />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted">{product.brand}</p>
            <h3 className="mt-0.5 text-base font-semibold leading-snug tracking-tight text-ink">
              <NameLink product={product} />
            </h3>
          </div>
          <ScoreBadge score={score} size="md" />
        </div>

        <dl className="mb-4 mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {rows.map((r) => (
            <div key={r.key} className="min-w-0">
              <dt className="text-[11px] text-subtle">{r.label}</dt>
              <dd className="truncate text-[13px] font-medium text-ink-2" title={r.value}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3.5">
          <div className="min-w-0">
            <p className="text-[11px] text-subtle">Best price</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Price value={price} size="lg" />
              <PriceChange percent={change.percent} size="sm" />
            </div>
          </div>
          <Sparkline points={trend} width={72} height={26} className="mb-1 shrink-0" />
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder matching the grid card. */
export function ProductCardSkeleton({ variant = "grid" }: { variant?: "grid" | "compact" | "row" }) {
  if (variant === "compact") {
    return (
      <div className="card flex items-center gap-3 p-2 pr-3.5" aria-hidden>
        <Skeleton className="size-20 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("card p-2", variant === "row" && "sm:flex sm:gap-6")} aria-hidden>
      <Skeleton className={cn("aspect-[4/3] w-full rounded-[12px]", variant === "row" && "sm:w-52")} />
      <div className="flex-1 space-y-3 px-2.5 pb-2 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
}
