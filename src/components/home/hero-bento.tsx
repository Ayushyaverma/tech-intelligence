import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { DeviceArt, deviceVariant } from "@/components/device-art";
import { Badge } from "@/components/ui/badge";
import { Price, PriceChange } from "@/components/ui/price";
import { Sparkline } from "@/components/ui/sparkline";
import { getCategory } from "@/lib/categories";
import { productHref } from "@/lib/product-utils";
import type { NewsArticle, Product } from "@/lib/types";
import { cn } from "@/lib/format";
import { KIND_LABELS, RADIUS, articleHref, shortDate, tintedBackdrop } from "./home-utils";
import { ProductThumb } from "./product-thumb";

export interface PriceDropRow {
  product: Product;
  price: number;
  percent: number;
  amount: number;
  /** recent recorded prices for the sparkline */
  points: number[];
}

/** Small "See all" link used in the bento card headers. */
function CardAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group/action inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
    >
      {label}
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/action:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function CardHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action: { href: string; label: string } }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="eyebrow">{eyebrow}</h2>
        <p className="mt-1 text-lg font-semibold tracking-tight text-ink">{title}</p>
      </div>
      <CardAction {...action} />
    </div>
  );
}

/* ------------------------------------------------------------ launch */

interface LaunchCardProps {
  article: NewsArticle;
  /** product drawn in the card; usually the article's first related product */
  product?: Pick<Product, "category" | "art" | "specs" | "name">;
  className?: string;
}

/** The large hero card: the featured launch story with a big device render. */
export function LaunchCard({ article, product, className }: LaunchCardProps) {
  const category = article.category ? getCategory(article.category) : product ? getCategory(product.category) : undefined;
  const art = product?.art ?? { primary: "#3b3c40", accent: "#8b93ff" };

  return (
    <Link
      href={articleHref(article.slug)}
      style={{ ...RADIUS.panel, background: tintedBackdrop(art.accent, art.primary, 30) }}
      className={cn(
        "card-hover group relative isolate flex min-h-[26rem] flex-col overflow-hidden rounded-panel border border-line p-5 shadow-sm sm:p-7 lg:min-h-0",
        className,
      )}
    >
      {/* faint light sweep from the top-left for depth */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{ background: "linear-gradient(135deg, var(--glass-highlight) 0%, transparent 42%)" }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="sr-only">Latest launches</h2>
          <Badge tone="accent" className="bg-surface/70 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Latest launch
          </Badge>
          {category && <Badge className="bg-surface/70 backdrop-blur-sm">{category.shortName}</Badge>}
        </div>
        <time dateTime={article.publishedAt} className="text-xs font-medium text-muted tnum">
          {shortDate(article.publishedAt)}
        </time>
      </div>

      {product && (
        <div className="relative flex flex-1 items-center justify-center py-4 sm:py-6">
          <span
            aria-hidden
            className="absolute inset-x-[18%] bottom-[18%] top-[22%] -z-10 rounded-full blur-3xl"
            style={{ background: `color-mix(in oklab, ${art.accent} 30%, transparent)` }}
          />
          <DeviceArt
            category={product.category}
            primary={art.primary}
            accent={art.accent}
            variant={deviceVariant(product)}
            className="w-full max-w-[26rem] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03] lg:max-w-[30rem]"
          />
        </div>
      )}

      <div className={cn("relative", !product && "mt-auto")}>
        <h3 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-xl text-[15px] leading-relaxed text-muted">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
          <p className="text-[13px] font-medium text-ink-2">
            New launches <span className="text-subtle">·</span> Reviews <span className="text-subtle">·</span> Updates
          </p>
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full bg-ink text-bg shadow-sm transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------ price watch */

export function PriceWatchCard({ drops, className }: { drops: PriceDropRow[]; className?: string }) {
  return (
    <div className={cn("card flex flex-col p-5 sm:p-6", className)}>
      <CardHeading eyebrow="Price watch" title="Latest price drops" action={{ href: "/deals", label: "All deals" }} />
      {drops.length ? (
        <ul className="mt-3 flex flex-1 flex-col justify-between divide-y divide-line">
          {drops.map((d) => (
            <li key={d.product.slug}>
              <Link
                href={productHref(d.product)}
                className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2"
              >
                <ProductThumb product={d.product} className="size-11" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink transition-colors duration-150 group-hover:text-accent">
                    {d.product.name}
                  </span>
                  <span className="block truncate text-xs text-muted">{d.product.brand}</span>
                </span>
                <Sparkline points={d.points} width={56} height={22} className="hidden shrink-0 sm:block lg:hidden xl:block" />
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Price value={d.price} size="sm" />
                  <PriceChange percent={d.percent} size="sm" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted">No recorded price drops in the last 30 days.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ news */

export function NewsCard({ articles, className }: { articles: NewsArticle[]; className?: string }) {
  return (
    <div className={cn("card flex flex-col p-5 sm:p-6", className)}>
      <CardHeading eyebrow="Tech news" title="What's happening?" action={{ href: "/news", label: "All news" }} />
      {articles.length ? (
        <ol className="mt-3 flex flex-1 flex-col justify-between divide-y divide-line">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                href={articleHref(a.slug)}
                className="group -mx-2 block rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2"
              >
                <span className="flex items-center gap-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink-2">
                    <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                    {KIND_LABELS[a.kind]}
                  </span>
                  <span aria-hidden className="text-subtle">·</span>
                  <time dateTime={a.publishedAt} className="tnum">
                    {shortDate(a.publishedAt)}
                  </time>
                </span>
                <span className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors duration-150 group-hover:text-accent">
                  {a.title}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-muted">No stories published yet.</p>
      )}
    </div>
  );
}
