import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export type BadgeTone = "neutral" | "accent" | "positive" | "warning" | "negative";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-2 ring-line",
  accent: "bg-accent-soft text-accent ring-accent/15",
  positive: "bg-positive-soft text-positive ring-positive/15",
  warning: "bg-warning-soft text-warning ring-warning/15",
  negative: "bg-negative-soft text-negative ring-negative/15",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Small rounded label: tiers, statuses, "Verified", "Sample data" ... */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium leading-5 ring-1 ring-inset",
        "[&_svg]:size-3 [&_svg]:shrink-0",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
