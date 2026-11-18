import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Info, ShieldCheck, ShoppingBag, TrendingDown } from "lucide-react";
import { CompareToggle } from "@/components/compare/compare-toggle";
import { toCompareItem } from "@/components/compare/compare-item";
import { deviceVariant } from "@/components/device-art";
import { TIER_LABELS } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Price, PriceChange } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";
import { ScoreRing } from "@/components/ui/score";
import { Stars } from "@/components/ui/stars";
import { bestOffer, currentPrice, lowestEver, priceChange, scoreLabel, specField } from "@/lib/product-utils";
import type { CategoryConfig, Product } from "@/lib/types";
import { formatINR, formatPercent } from "@/lib/format";
import { HeroGallery } from "./hero-gallery";
import { SCORE_TYPE_LABELS, formatDateTimeIST, formatDay, specText } from "./helpers";
import { ShareButton } from "./share-button";

interface ProductHeroProps {
  product: Product;
  category: CategoryConfig;
  score: number;
  /** position by platform score within the category (1-based) */
  rank: number;
  rankOf: number;
  fullName: string;
}

export function ProductHero({ product, category, score, rank, rankOf, fullName }: ProductHeroProps) {
  const scoreType = SCORE_TYPE_LABELS[product.scoreType];

  return (
    <section aria-labelledby="product-title" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-14">
      <Reveal y={10} className="lg:sticky lg:top-24">
        <HeroGallery
          name={fullName}
          category={product.category}
          art={product.art}
          colors={product.colors}
          variant={deviceVariant(product)}
        />
      </Reveal>

      <Reveal y={10} delay={0.06} className="min-w-0">
        {/* identity */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/category/${category.slug}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface px-2.5 text-xs font-medium text-ink-2 ring-1 ring-line transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <CategoryIcon icon={category.icon} className="size-3.5" />
            {category.shortName}
          </Link>
          <span className="eyebrow">{product.brand}</span>
        </div>

        <h1 id="product-title" className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
          {fullName}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge>{TIER_LABELS[product.tier]}</Badge>
          {product.verified ? (
            <Badge tone="positive">
              <ShieldCheck aria-hidden /> Verified data
            </Badge>
          ) : (
            <Badge tone="warning">
              <Clock aria-hidden /> Pending verification
            </Badge>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            Released {formatDay(product.releaseDate)}
          </span>
        </div>

        <p className="mt-5 text-lg leading-relaxed text-ink-2 sm:text-xl">{product.tagline}</p>

        {product.userFeedback && product.userFeedback.count > 0 && (
          <a
            href="#reviews"
            className="mt-3 inline-flex items-center gap-2 rounded-full text-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            <Stars value={product.userFeedback.average} />
            <span className="tnum">
              <span className="font-medium text-ink">{product.userFeedback.average.toFixed(1)}</span> ·{" "}
              {product.userFeedback.count.toLocaleString("en-IN")} user ratings
            </span>
          </a>
        )}

        <KeySpecChips product={product} category={category} />

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {/* score */}
          <div className="card flex flex-col p-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={score} size={96} label="" />
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight text-ink">{scoreLabel(score)}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  #{rank} of {rankOf} {category.shortName.toLowerCase()}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink-2" title={scoreType.description}>
                  <Info className="size-3.5 text-subtle" aria-hidden />
                  {scoreType.label}
                </p>
              </div>
            </div>
            <Link
              href="/methodology"
              className="group mt-auto inline-flex items-center gap-1 self-start rounded-full pt-4 text-[13px] font-medium text-accent transition-colors duration-150 hover:text-accent-strong"
            >
              How we score
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <PriceBox product={product} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <a href="#where-to-buy" className="btn-accent inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:size-4">
            <ShoppingBag aria-hidden /> Where to buy
          </a>
          <CompareToggle item={toCompareItem(product)} variant="button" />
          <ShareButton title={fullName} />
        </div>
      </Reveal>
    </section>
  );
}

function KeySpecChips({ product, category }: { product: Product; category: CategoryConfig }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Key specifications">
      {category.keySpecs.map((key) => {
        const field = specField(category, key);
        return (
          <li
            key={key}
            className="inline-flex items-baseline gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-[13px] shadow-xs ring-1 ring-line"
          >
            <span className="text-subtle">{field?.label ?? key}</span>
            <span className="font-medium text-ink">{specText(field, product.specs[key])}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PriceBox({ product }: { product: Product }) {
  const price = currentPrice(product);
  const offer = bestOffer(product);
  const change = priceChange(product, 30);
  const low = lowestEver(product);
  const atLow = price <= low;
  const vsLaunch = product.msrp ? ((price - product.msrp) / product.msrp) * 100 : 0;

  return (
    <div className="card relative flex flex-col overflow-hidden p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-70 blur-2xl"
        style={{ background: "radial-gradient(circle, var(--accent-soft), transparent 70%)" }}
      />
      <p className="relative text-xs font-medium text-muted">
        {offer && !offer.inStock ? "Last listed price" : "Best price"}
        {offer && <span className="text-subtle"> · {offer.retailer}</span>}
      </p>
      <div className="relative mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <Price value={price} size="xl" />
      </div>
      <div className="relative mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <PriceChange percent={change.percent} amount={change.amount} size="sm" />
        <span>in 30 days</span>
      </div>

      <dl className="relative mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Lowest recorded</dt>
          <dd className="flex items-center gap-1.5 font-medium text-ink tnum">
            {atLow && <TrendingDown className="size-3.5 text-positive" aria-hidden />}
            {formatINR(low)}
          </dd>
        </div>
        {product.msrp > 0 && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Launch price</dt>
            <dd className="text-ink-2 tnum">
              {formatINR(product.msrp)}
              {Math.abs(vsLaunch) >= 0.5 && (
                <span className={vsLaunch < 0 ? "ml-1.5 text-positive" : "ml-1.5 text-negative"}>{formatPercent(vsLaunch)}</span>
              )}
            </dd>
          </div>
        )}
      </dl>
      {atLow && (
        <p className="relative mt-2 text-xs font-medium text-positive">At its lowest recorded price</p>
      )}
      {offer && (
        <p className="relative mt-auto flex items-start gap-1.5 pt-3 text-[11.5px] leading-snug text-subtle">
          <Clock className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            Last checked {formatDateTimeIST(offer.checkedAt)} · {offer.retailer}
          </span>
        </p>
      )}
    </div>
  );
}
