"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/format";

/**
 * Column layout shared by every column-aligned block on the comparison page
 * (sticky header, summary, scores, specs, prices, pros/cons).
 *
 * Each block is its own horizontal scroller (so the sticky header can live
 * outside them), and all scrollers are kept in sync: swipe any block on a
 * phone and every block moves together. The label column is sticky-left and
 * product columns snap into place.
 */

interface ColumnsValue {
  count: number;
  /** an extra trailing column for the "+ Add product" slot */
  withAdd: boolean;
  register: (el: HTMLElement) => () => void;
}

const ColumnsContext = createContext<ColumnsValue | null>(null);

function useColumns(): ColumnsValue {
  const ctx = useContext(ColumnsContext);
  if (!ctx) throw new Error("Compare grid components must be inside <ColumnsProvider>");
  return ctx;
}

/** Responsive column sizes as CSS variables (label column, product column minimum, add column minimum). */
export const COLUMN_VARS =
  "[--label-w:6.75rem] sm:[--label-w:9.5rem] lg:[--label-w:12.5rem] " +
  "[--col-min:9.75rem] sm:[--col-min:12rem] [--add-min:6.5rem] sm:[--add-min:9rem]";

export function ColumnsProvider({ count, withAdd, children }: { count: number; withAdd: boolean; children: ReactNode }) {
  const scrollers = useRef(new Set<HTMLElement>());
  const leader = useRef<HTMLElement | null>(null);
  const idle = useRef<number | undefined>(undefined);

  const onScroll = useCallback((e: Event) => {
    const src = e.currentTarget as HTMLElement;
    // Followers fire scroll events when we move them; ignore those echoes.
    if (leader.current && leader.current !== src) return;
    leader.current = src;
    for (const el of scrollers.current) {
      if (el === src || el.scrollLeft === src.scrollLeft) continue;
      el.style.scrollSnapType = "none"; // don't let followers snap mid-gesture
      el.scrollLeft = src.scrollLeft;
    }
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      leader.current = null;
      for (const el of scrollers.current) el.style.scrollSnapType = "";
    }, 160);
  }, []);

  const register = useCallback(
    (el: HTMLElement) => {
      const peer = scrollers.current.values().next().value;
      if (peer) el.scrollLeft = peer.scrollLeft; // e.g. a spec group re-expanded mid-scroll
      scrollers.current.add(el);
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        scrollers.current.delete(el);
        el.removeEventListener("scroll", onScroll);
      };
    },
    [onScroll],
  );

  const value = useMemo(() => ({ count, withAdd, register }), [count, withAdd, register]);
  return <ColumnsContext.Provider value={value}>{children}</ColumnsContext.Provider>;
}

/** Assign a value to a callback or object ref (kept outside components so refs are not mutated during render). */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** A synced horizontal scroller. Put one or more <ColumnRow>s inside. */
export function ColumnScroller({
  children,
  className,
  scrollRef,
}: {
  children: ReactNode;
  className?: string;
  /** optional extra ref (e.g. for prev/next column buttons) */
  scrollRef?: Ref<HTMLDivElement>;
}) {
  const { register } = useColumns();
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      assignRef(scrollRef, el);
      const unregister = register(el);
      return () => {
        unregister();
        assignRef(scrollRef, null);
      };
    },
    [register, scrollRef],
  );
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-x-auto overscroll-x-contain no-scrollbar",
        "max-lg:snap-x max-lg:snap-mandatory scroll-pl-[var(--label-w)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function useGridStyle(): CSSProperties {
  const { count, withAdd } = useColumns();
  return {
    gridTemplateColumns: `var(--label-w) repeat(${count}, minmax(var(--col-min), 1fr))${
      withAdd ? " minmax(var(--add-min), 0.6fr)" : ""
    }`,
    minWidth: `calc(var(--label-w) + ${count} * var(--col-min)${withAdd ? " + var(--add-min)" : ""})`,
  };
}

interface ColumnRowProps {
  /** content of the sticky label cell */
  label: ReactNode;
  /** one cell per product, in column order */
  children: ReactNode;
  /** content of the trailing add column (empty in body rows) */
  addCell?: ReactNode;
  className?: string;
  /** replaces the label cell's default background + padding ("bg-surface py-3 pr-3") */
  labelClassName?: string;
  /** accessible name for the row group */
  ariaLabel?: string;
}

/** One grid row: sticky label cell + product cells (+ trailing add column when there is room). */
export function ColumnRow({ label, children, addCell, className, labelClassName, ariaLabel }: ColumnRowProps) {
  const { withAdd } = useColumns();
  const style = useGridStyle();
  return (
    <div role="group" aria-label={ariaLabel} className={cn("relative grid", className)} style={style}>
      <div
        className={cn(
          "sticky left-0 z-10 min-w-0 text-[13px] sm:text-sm",
          "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-line lg:after:hidden",
          labelClassName ?? "bg-surface py-3 pr-3",
        )}
      >
        {label}
      </div>
      {children}
      {withAdd && <div className="snap-start">{addCell}</div>}
    </div>
  );
}

/** A product cell. The product name is announced to screen readers before the value. */
export function ColumnCell({
  productName,
  children,
  className,
}: {
  productName: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 snap-start px-2.5 py-3 animate-fade-up sm:px-4", className)}>
      <span className="sr-only">{productName}: </span>
      {children}
    </div>
  );
}
