import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CompareToggle } from "@/components/compare/compare-toggle";
import { Badge } from "@/components/ui/badge";
import { Price, PriceChange } from "@/components/ui/price";
import { ScoreBadge } from "@/components/ui/score";
import { Sparkline } from "@/components/ui/sparkline";
import { cn, formatINR } from "@/lib/format";
import { ArtStage } from "./art-stage";
import type { DealData } from "./types";

/** Price-drop card for /deals: old → new price, drop, 90-day sparkline and lowest-ever flag. */
export function DealCard({ deal, className }: { deal: DealData; className?: string }) {
  return (
    <article
      className={cn(
        "group relative card card-hover flex h-full flex-col overflow-hidden has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
        className,
      )}
    >
      <div className="relative">
        <ArtStage arts={[deal.art]} className="aspect-[16/10]" />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {/* solid backing so the tinted pill stays legible over the artwork */}
          <span className="inline-flex rounded-full bg-surface shadow-xs">
            <PriceChange percent={deal.percent} size="md" />
          </span>
          <CompareToggle item={deal.compare} className="pointer-events-auto relative z-30" />
        </div>
        {deal.lowestEver && (
          <span className="absolute bottom-3 left-3 inline-flex rounded-full bg-surface shadow-xs">
            <Badge tone="positive">
              <Sparkles aria-hidden />
              Lowest recorded
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted">
              {deal.brand} · {deal.categoryName}
            </p>
            <h3 className="mt-0.5 text-base font-semibold leading-snug tracking-tight text-ink">
              <Link
                href={deal.href}
                className="outline-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:content-['']"
              >
                {deal.name}
                <span className="sr-only"> by {deal.brand}</span>
              </Link>
            </h3>
          </div>
          <ScoreBadge score={deal.score} size="sm" />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            <p className="text-xs text-subtle">
              <span className="sr-only">Was </span>
              <s className="tnum">{formatINR(deal.oldPrice)}</s>
              <span className="ml-1.5 text-positive">save {formatINR(Math.abs(deal.amount))}</span>
            </p>
            <Price value={deal.price} size="lg" className="mt-0.5 block" />
            {deal.retailer && (
              <p className="mt-1 truncate text-[11.5px] text-muted">
                at {deal.retailer}
                {deal.checkedLabel && (
                  <>
                    {" "}
                    · checked <time dateTime={deal.checkedAt}>{deal.checkedLabel}</time>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <Sparkline points={deal.points} width={84} height={30} />
            <p className="mt-1 text-[10.5px] text-subtle">90 days</p>
          </div>
        </div>
      </div>
    </article>
  );
}
