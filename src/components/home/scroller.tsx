"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

interface ScrollerProps {
  children: ReactNode;
  /** accessible name for the scroll region, e.g. "Recent price drops" */
  label: string;
  /** classes for the scrolling track (layout of the items: flex / grid, gaps, column widths) */
  trackClassName?: string;
  className?: string;
}

const FADE = 28; // px of edge fade where more content is hidden

/**
 * Horizontal, snap-scrolling row. Server-rendered children; this island only
 * adds the desktop arrow buttons and fades whichever edge has more content.
 * Touch / trackpad / Shift+wheel / keyboard (focus the row, then arrow keys) all work natively.
 */
export function Scroller({ children, label, trackClassName, className }: ScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft < max - 2 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  const mask = `linear-gradient(90deg, ${edges.start ? "transparent" : "#000"}, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${
    edges.end ? "transparent" : "#000"
  })`;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          // the vertical padding keeps hover lift + shadows from being clipped by the scroll box
          "no-scrollbar -my-4 snap-x snap-mandatory overflow-x-auto overscroll-x-contain py-4",
          "scroll-px-4 sm:scroll-px-6 lg:scroll-px-0",
          trackClassName,
        )}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>

      <ArrowButton dir={-1} hidden={!edges.start} onClick={() => page(-1)} />
      <ArrowButton dir={1} hidden={!edges.end} onClick={() => page(1)} />
    </div>
  );
}

function ArrowButton({ dir, hidden, onClick }: { dir: 1 | -1; hidden: boolean; onClick: () => void }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={-1} // keyboard users scroll the focused region with arrow keys instead
      aria-hidden
      className={cn(
        "btn-glass absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full text-ink md:grid",
        dir === 1 ? "-right-4 xl:-right-6" : "-left-4 xl:-left-6",
        "transition-opacity duration-200",
        hidden ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
    </button>
  );
}
