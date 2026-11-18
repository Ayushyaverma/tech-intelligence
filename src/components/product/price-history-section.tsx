import { BadgeCheck, Hourglass, TrendingDown } from "lucide-react";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { currentPrice } from "@/lib/product-utils";
import type { PricePoint, Product } from "@/lib/types";
import { cn, formatINR } from "@/lib/format";
import { formatDay } from "./helpers";

function extreme(points: PricePoint[], pick: (a: number, b: number) => boolean) {
  return points.reduce<PricePoint | undefined>((best, p) => (!best || pick(p.price, best.price) ? p : best), undefined);
}

/** A plain-language read of where today's price sits in its recorded range. Never a prediction. */
function insight(price: number, low: number, lowDate: string | undefined) {
  const above = low ? ((price - low) / low) * 100 : 0;
  if (above <= 0.5) {
    return {
      tone: "positive" as const,
      icon: BadgeCheck,
      title: "At its lowest recorded price",
      body: "Today's best price matches the lowest we have recorded for this product.",
    };
  }
  if (above <= 4) {
    return {
      tone: "positive" as const,
      icon: TrendingDown,
      title: "Close to its recorded low",
      body: `Within ${above.toFixed(1)}% of the lowest price we've recorded (${formatINR(low)}${lowDate ? `, ${formatDay(lowDate)}` : ""}).`,
    };
  }
  return {
    tone: "warning" as const,
    icon: Hourglass,
    title: `${above.toFixed(0)}% above its recorded low`,
    body: `It has sold for ${formatINR(low)}${lowDate ? ` (${formatDay(lowDate)})` : ""}. If you can wait, sale events have brought it lower before.`,
  };
}

/** Price-history chart (client island) plus recorded-data statistics. */
export function PriceHistorySection({ product, fullName }: { product: Product; fullName: string }) {
  const points = product.priceHistory;
  const price = currentPrice(product);
  const low = extreme(points, (a, b) => a < b);
  const high = extreme(points, (a, b) => a > b);
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.price, 0) / points.length) : price;
  const lowPrice = Math.min(low?.price ?? price, price);
  const note = insight(price, lowPrice, low && low.price <= price ? low.date : undefined);
  const Icon = note.icon;

  const stats = [
    { label: "Current best", value: formatINR(price), sub: "lowest in-stock offer" },
    { label: "Lowest recorded", value: low ? formatINR(low.price) : "—", sub: low ? formatDay(low.date) : undefined, good: true },
    { label: "Highest recorded", value: high ? formatINR(high.price) : "—", sub: high ? formatDay(high.date) : undefined },
    { label: "Average", value: formatINR(avg), sub: "across all records" },
  ];

  return (
    <div className="card p-4 sm:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <PriceHistoryChart series={[{ name: fullName, points }]} height={320} defaultRange="6M" />
        </div>

        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface-2/70 px-4 py-3 ring-1 ring-inset ring-line">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className={cn("mt-0.5 text-lg font-semibold tracking-tight tnum", s.good ? "text-positive" : "text-ink")}>
                  {s.value}
                </dd>
                {s.sub && <dd className="text-[11.5px] text-subtle">{s.sub}</dd>}
              </div>
            ))}
          </dl>

          <div
            className={cn(
              "rounded-2xl px-4 py-3.5 ring-1 ring-inset",
              note.tone === "positive" ? "bg-positive-soft ring-positive/15" : "bg-warning-soft ring-warning/15",
            )}
          >
            <p className={cn("flex items-center gap-1.5 text-sm font-semibold", note.tone === "positive" ? "text-positive" : "text-warning")}>
              <Icon className="size-4" aria-hidden />
              {note.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">{note.body}</p>
          </div>
        </div>
      </div>

      <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        <span className="font-medium text-ink-2 tnum">{points.length} recorded price points</span>
        {points.length > 0 && (
          <>
            {" "}
            from {formatDay(points[0].date)} to {formatDay(points[points.length - 1].date)}, each the best price we
            verified at a named retailer on that date.
          </>
        )}{" "}
        We never interpolate or estimate missing days, and the summary above is a reading of past prices — not a forecast.
      </p>
    </div>
  );
}
