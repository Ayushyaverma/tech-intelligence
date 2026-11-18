import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** When defined the chip behaves as a toggle (aria-pressed). */
  selected?: boolean;
}

/** Rounded toggle pill used for filters, tiers and quick picks. */
export function Chip({ selected, className, children, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium",
        "transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
        selected
          ? "bg-ink text-bg shadow-sm"
          : "bg-surface text-ink-2 shadow-xs ring-1 ring-inset ring-line hover:bg-surface-2 hover:text-ink hover:ring-line-strong",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
