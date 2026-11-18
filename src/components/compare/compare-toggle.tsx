"use client";

import { Check, GitCompareArrows } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/format";
import { useCompare, type CompareItem } from "./compare-provider";

interface CompareToggleProps {
  item: CompareItem;
  /** "checkbox": compact pill for cards. "button": full-size glass button for product pages. */
  variant?: "checkbox" | "button";
  className?: string;
}

/** Adds/removes a product from the comparison; explains (via toast) when it can't. */
export function CompareToggle({ item, variant = "checkbox", className }: CompareToggleProps) {
  const compare = useCompare();
  const selected = compare.has(item.slug);

  function onClick() {
    const res = compare.toggle(item);
    if (!res.ok && res.reason) toast(res.reason, { tone: "warning" });
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          selected ? "btn-accent" : "btn-glass text-ink",
          className,
        )}
      >
        {selected ? <Check className="size-4" aria-hidden /> : <GitCompareArrows className="size-4" aria-hidden />}
        {selected ? "Added to compare" : "Add to compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Compare ${item.name}`}
      onClick={onClick}
      className={cn(
        "group/ct inline-flex h-8 select-none items-center gap-2 rounded-full pl-2 pr-3 text-xs font-medium",
        "transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        selected ? "bg-accent text-accent-ink shadow-glow" : "btn-glass text-ink-2 hover:text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-4 place-items-center rounded-[5px] transition-colors duration-150",
          selected ? "bg-white/25" : "bg-surface ring-1 ring-inset ring-line-strong group-hover/ct:ring-accent/50",
        )}
      >
        <Check className={cn("size-3 transition-opacity duration-150", selected ? "opacity-100" : "opacity-0")} strokeWidth={3} />
      </span>
      Compare
    </button>
  );
}
