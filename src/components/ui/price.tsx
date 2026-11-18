import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, formatINR, formatPercent } from "@/lib/format";

const PRICE_SIZES = {
  sm: "text-sm font-semibold",
  md: "text-base font-semibold",
  lg: "text-xl font-semibold tracking-tight",
  xl: "text-3xl font-semibold tracking-tight sm:text-4xl",
} as const;

interface PriceProps {
  value: number;
  size?: keyof typeof PRICE_SIZES;
  className?: string;
}

/** INR price with tabular digits. */
export function Price({ value, size = "md", className }: PriceProps) {
  return <span className={cn("text-ink tnum", PRICE_SIZES[size], className)}>{formatINR(value)}</span>;
}

const CHANGE_SIZES = {
  sm: "text-[11.5px] px-1.5 py-0.5 gap-0.5 [&_svg]:size-3",
  md: "text-xs px-2 py-0.5 gap-1 [&_svg]:size-3.5",
  lg: "text-sm px-2.5 py-1 gap-1 [&_svg]:size-4",
} as const;

interface PriceChangeProps {
  /** Percentage change; negative = price drop (good for buyers). */
  percent: number;
  /** Optional rupee change shown after the percentage. */
  amount?: number;
  size?: keyof typeof CHANGE_SIZES;
  className?: string;
}

/** Drop = green down arrow, rise = orange up arrow, |change| < 0.5% = neutral "flat". */
export function PriceChange({ percent, amount, size = "md", className }: PriceChangeProps) {
  const dir = percent <= -0.5 ? "down" : percent >= 0.5 ? "up" : "flat";
  const Icon = dir === "down" ? ArrowDownRight : dir === "up" ? ArrowUpRight : Minus;
  const tone =
    dir === "down"
      ? "bg-positive-soft text-positive"
      : dir === "up"
        ? "bg-negative-soft text-negative"
        : "bg-surface-2 text-muted";
  const spoken =
    dir === "flat"
      ? "Price unchanged"
      : `Price ${dir === "down" ? "down" : "up"} ${formatPercent(percent, false)}${
          amount ? `, ${formatINR(Math.abs(amount))}` : ""
        }`;

  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap rounded-full font-medium tnum", CHANGE_SIZES[size], tone, className)}
      aria-label={spoken}
      title={spoken}
    >
      <Icon aria-hidden strokeWidth={2.25} />
      <span aria-hidden>
        {dir === "flat" ? "Flat" : formatPercent(percent)}
        {amount && dir !== "flat" ? (
          <span className="ml-1 opacity-75">
            {amount < 0 ? "−" : "+"}
            {formatINR(Math.abs(amount))}
          </span>
        ) : null}
      </span>
    </span>
  );
}
