import Link from "next/link";
import { ArrowUpRight, Info, PackageX, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import type { RetailerOffer } from "@/lib/types";
import { cn, formatINR } from "@/lib/format";
import { InitialAvatar } from "./avatar";
import { formatDateTimeIST } from "./helpers";

const COLS = "md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] md:items-center md:gap-6";

interface WhereToBuyProps {
  offers: RetailerOffer[];
  productName: string;
  /** settings.demoMode — adds a note that retailer links are placeholders */
  demo: boolean;
}

/**
 * Retailer prices, in-stock offers first and cheapest first. Affiliate links
 * carry rel="sponsored" and are labelled; the order never depends on commission.
 */
export function WhereToBuy({ offers, productName, demo }: WhereToBuyProps) {
  if (!offers.length) {
    return <EmptyState icon={Store} title="No retailer prices yet" description="We list retailers once we've verified a live price." />;
  }
  const sorted = [...offers].sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.price - b.price);
  const best = sorted[0];
  const hasAffiliate = offers.some((o) => o.affiliate);

  return (
    <Reveal className="space-y-4">
      <div className="card overflow-hidden">
        <div className={cn("hidden border-b border-line bg-surface-2/60 px-6 py-3 text-xs font-medium text-muted", COLS)} aria-hidden>
          <span>Retailer</span>
          <span>Price</span>
          <span>Availability</span>
          <span>Last checked</span>
          <span className="w-[8.5rem]" />
        </div>
        <ul className="divide-y divide-line">
          {sorted.map((o) => {
            const isBest = o === best && o.inStock;
            const diff = o.price - best.price;
            return (
              <li
                key={o.retailer}
                className={cn(
                  "relative px-5 py-4 transition-colors duration-150 hover:bg-surface-2/40 sm:px-6",
                  COLS,
                  isBest && "bg-positive-soft/40",
                  !o.inStock && "opacity-75",
                )}
              >
                {isBest && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-positive" />}
                <div className="flex items-center gap-3">
                  <InitialAvatar name={o.retailer} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ink">{o.retailer}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      {isBest && <Badge tone="positive">Best price</Badge>}
                      {o.affiliate && <Badge>Affiliate</Badge>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 md:contents">
                  <div className="md:mt-0">
                    <p className="text-lg font-semibold tracking-tight text-ink tnum">{formatINR(o.price)}</p>
                    {diff > 0 && <p className="text-xs text-subtle tnum">+{formatINR(diff)} vs best</p>}
                  </div>

                  <p className="text-[13px]">
                    {o.inStock ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-positive">
                        <span aria-hidden className="size-1.5 rounded-full bg-positive" /> In stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-muted">
                        <PackageX className="size-3.5" aria-hidden /> Out of stock
                      </span>
                    )}
                  </p>

                  <p className="w-full text-xs text-muted md:w-auto">
                    <span className="md:hidden">Checked </span>
                    {formatDateTimeIST(o.checkedAt)}
                  </p>

                  <a
                    href={o.url}
                    target="_blank"
                    rel={o.affiliate ? "sponsored noopener" : "noopener"}
                    className={cn(
                      "inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium sm:w-[8.5rem]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      isBest ? "btn-accent" : "btn-glass text-ink",
                    )}
                  >
                    {o.inStock ? "Go to store" : "View store"}
                    <ArrowUpRight className="size-4" aria-hidden />
                    <span className="sr-only">
                      : {productName} at {o.retailer}, {formatINR(o.price)} (opens in a new tab)
                    </span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-surface-2/70 px-5 py-4 text-[13px] leading-relaxed text-ink-2 ring-1 ring-inset ring-line">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p>
          {hasAffiliate ? (
            <>
              Links marked <span className="font-medium text-ink">Affiliate</span> may earn us a commission if you buy, at no
              extra cost to you.{" "}
            </>
          ) : null}
          Retailers are always ordered by price, and commissions never influence our scores or recommendations. Prices
          can change after we check them — confirm on the retailer&apos;s site before you buy.
          {demo && " Retailer links in this sample build are placeholders."}{" "}
          <Link
            href="/affiliate-disclosure"
            className="rounded font-medium text-accent underline-offset-2 transition-colors duration-150 hover:text-accent-strong hover:underline"
          >
            Read our affiliate disclosure
          </Link>
        </p>
      </div>
    </Reveal>
  );
}
