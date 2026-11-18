import Link from "next/link";
import { ArrowRight, TrendingDown } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceChange } from "@/components/ui/price";
import type { Product } from "@/lib/types";
import { HomeSection } from "./home-section";
import { RADIUS } from "./home-utils";
import { Scroller } from "./scroller";

export interface PriceUpdateItem {
  product: Product;
  score: number;
  percent: number;
  amount: number;
}

/** Section 3: a two-row, snap-scrolling board of the biggest recorded 30-day drops. */
export function PriceUpdates({ items }: { items: PriceUpdateItem[] }) {
  return (
    <HomeSection
      id="price-updates"
      header={{
        eyebrow: "Price updates",
        title: "Recent drops and changes",
        description: "The biggest 30-day price moves across retailers — calculated from recorded prices only, never estimates.",
        action: { href: "/deals", label: "All deals" },
      }}
    >
      {items.length ? (
        <Scroller
          label="Recent price drops"
          className="-mx-4 sm:-mx-6 lg:mx-0"
          trackClassName="grid auto-cols-[min(20rem,82vw)] grid-flow-col grid-rows-2 gap-x-4 gap-y-6 px-4 sm:px-6 lg:px-0"
        >
          {items.map((item, i) => (
            <div key={item.product.slug} className="snap-start">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <PriceChange percent={item.percent} amount={item.amount} size="md" />
                <span className="text-xs text-muted">vs 30 days ago</span>
              </div>
              <ProductCard product={item.product} score={item.score} variant="compact" priority={i < 2} />
            </div>
          ))}
          <AllDealsCard count={items.length} />
        </Scroller>
      ) : (
        <EmptyState
          icon={TrendingDown}
          title="No price drops right now"
          description="Prices have held steady over the last 30 days. We'll list drops here as soon as they're recorded."
          action={{ href: "/deals", label: "Browse deals" }}
        />
      )}
    </HomeSection>
  );
}

/** Closing tile of the scroller, spanning both rows. */
function AllDealsCard({ count }: { count: number }) {
  return (
    <Link
      href="/deals"
      style={RADIUS.card}
      className="card card-hover group relative row-span-2 flex snap-start flex-col justify-between overflow-hidden p-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 100% 0%, var(--positive-soft), transparent 70%), radial-gradient(70% 60% at 0% 100%, var(--accent-soft), transparent 70%)",
        }}
      />
      <span className="relative grid size-11 place-items-center rounded-2xl bg-positive-soft text-positive ring-1 ring-positive/15">
        <TrendingDown className="size-5" aria-hidden />
      </span>
      <span className="relative">
        <span className="block text-xl font-semibold tracking-tight text-ink">Every recorded drop</span>
        <span className="mt-2 block text-sm leading-relaxed text-muted">
          You&apos;ve seen the top {count}. The deals page tracks every category, with filters and price history.
        </span>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          Open deals
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  );
}
