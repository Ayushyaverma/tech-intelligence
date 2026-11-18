"use client";

import { Check, IndianRupee, Minus, Plus, ThumbsUp } from "lucide-react";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { Price, PriceChange } from "@/components/ui/price";
import { cn, formatINR } from "@/lib/format";
import { ColumnCell, ColumnRow, ColumnScroller } from "./compare-grid";
import { bestOf, formatCheckedAt } from "./compare-logic";
import { CompareSection } from "./compare-section";
import type { CompareProduct } from "./types";

/** Price rows (current, lowest ever, 30-day change, best retailer) + overlaid price history. */
export function ComparePrices({ products }: { products: CompareProduct[] }) {
  const cheapest = bestOf(
    products.map((p) => p.price),
    false,
  );
  const lowestEver = bestOf(
    products.map((p) => p.lowest),
    false,
  );

  return (
    <CompareSection
      id="prices"
      icon={IndianRupee}
      title="Price comparison"
      description="Latest verified prices in INR, and every recorded price point on a common date range."
    >
      <ColumnScroller>
        <div className="divide-y divide-line">
          <ColumnRow ariaLabel="Current price" label={<RowLabel title="Best price now" hint="Lowest in-stock offer" />}>
            {products.map((p, i) => (
              <ColumnCell key={p.slug} productName={p.name} className="flex flex-wrap items-center gap-2">
                <Price value={p.price} size="md" className={cn(cheapest.includes(i) && "text-positive")} />
                {cheapest.includes(i) && <Check className="size-4 text-positive" strokeWidth={3} aria-label="lowest" />}
              </ColumnCell>
            ))}
          </ColumnRow>
          <ColumnRow ariaLabel="Lowest recorded" label={<RowLabel title="Lowest recorded" hint="Across all price records" />}>
            {products.map((p, i) => (
              <ColumnCell key={p.slug} productName={p.name}>
                <span className={cn("text-sm font-medium tnum", lowestEver.includes(i) ? "text-positive" : "text-ink")}>
                  {formatINR(p.lowest)}
                </span>
                {p.price <= p.lowest && <span className="mt-1 block text-xs text-positive">At its lowest</span>}
              </ColumnCell>
            ))}
          </ColumnRow>
          <ColumnRow ariaLabel="30-day change" label={<RowLabel title="30-day change" />}>
            {products.map((p) => (
              <ColumnCell key={p.slug} productName={p.name}>
                <PriceChange percent={p.change30.percent} amount={p.change30.amount} size="sm" />
              </ColumnCell>
            ))}
          </ColumnRow>
          <ColumnRow ariaLabel="Launch price" label={<RowLabel title="Launch price" />}>
            {products.map((p) => (
              <ColumnCell key={p.slug} productName={p.name}>
                <span className="text-sm text-ink-2 tnum">{formatINR(p.msrp)}</span>
              </ColumnCell>
            ))}
          </ColumnRow>
          <ColumnRow ariaLabel="Best retailer" label={<RowLabel title="Best retailer" hint="Last checked" />}>
            {products.map((p) => (
              <ColumnCell key={p.slug} productName={p.name}>
                {p.offer ? (
                  <>
                    <span className="block text-sm font-medium text-ink">{p.offer.retailer}</span>
                    <span className="block text-xs text-muted">{formatCheckedAt(p.offer.checkedAt)}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted">No offers</span>
                )}
              </ColumnCell>
            ))}
          </ColumnRow>
        </div>
      </ColumnScroller>

      <div className="px-1 pb-4 pt-6 sm:px-0">
        <h3 className="mb-3 text-sm font-semibold text-ink">Price history</h3>
        <PriceHistoryChart
          series={products.map((p) => ({ name: `${p.brand} ${p.name}`, points: p.priceHistory }))}
          height={300}
          defaultRange="6M"
        />
      </div>
    </CompareSection>
  );
}

/** Compact pros & cons per product. */
export function CompareProsCons({ products }: { products: CompareProduct[] }) {
  return (
    <CompareSection id="pros-cons" icon={ThumbsUp} title="Pros & cons" description="The strengths and trade-offs our editors noted.">
      <ColumnScroller>
        <div className="divide-y divide-line">
          <ColumnRow ariaLabel="Pros" label={<RowLabel title="Pros" />}>
            {products.map((p) => (
              <ColumnCell key={p.slug} productName={p.name}>
                <List items={p.pros} tone="positive" />
              </ColumnCell>
            ))}
          </ColumnRow>
          <ColumnRow ariaLabel="Cons" label={<RowLabel title="Cons" />}>
            {products.map((p) => (
              <ColumnCell key={p.slug} productName={p.name}>
                <List items={p.cons} tone="negative" />
              </ColumnCell>
            ))}
          </ColumnRow>
        </div>
      </ColumnScroller>
    </CompareSection>
  );
}

function List({ items, tone }: { items: string[]; tone: "positive" | "negative" }) {
  const Icon = tone === "positive" ? Plus : Minus;
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-[13px] leading-snug text-ink-2">
          <Icon
            className={cn("mt-0.5 size-3.5 shrink-0", tone === "positive" ? "text-positive" : "text-negative")}
            strokeWidth={2.5}
            aria-hidden
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function RowLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <span className="block">
      <span className="block font-medium text-ink">{title}</span>
      {hint && <span className="block text-xs text-subtle">{hint}</span>}
    </span>
  );
}
