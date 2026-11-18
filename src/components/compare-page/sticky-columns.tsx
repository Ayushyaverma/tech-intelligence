"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { ProductVisual } from "@/components/product-visual";
import { Price } from "@/components/ui/price";
import { ScoreBadge } from "@/components/ui/score";
import { productHref } from "@/lib/product-utils";
import type { CategoryConfig } from "@/lib/types";
import { cn } from "@/lib/format";
import { ColumnRow, ColumnScroller } from "./compare-grid";
import { MAX_COMPARE } from "./compare-logic";
import type { CompareProduct } from "./types";

const EASE = [0.22, 1, 0.36, 1] as const;

interface StickyColumnsProps {
  products: CompareProduct[];
  category: CategoryConfig;
  onAdd: () => void;
  onRemove: (slug: string) => void;
  onReplace: (slug: string) => void;
}

/**
 * The product-name row that stays pinned under the site header while the
 * whole comparison scrolls, with remove (×) and replace (↔) controls.
 */
export function StickyColumns({ products, category, onAdd, onRemove, onReplace }: StickyColumnsProps) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const canAdd = products.length < MAX_COMPARE;

  /** Phone helper: move one product column left/right (every block follows). */
  function step(dir: 1 | -1) {
    const el = scroller.current;
    const col = el?.querySelector<HTMLElement>("[data-col]");
    if (!el || !col) return;
    el.scrollBy({ left: dir * col.offsetWidth, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="sticky top-[4.5rem] z-30">
      <div className="glass rounded-[22px] px-2 sm:px-3">
        <ColumnScroller scrollRef={scroller}>
          <ColumnRow
            ariaLabel="Products being compared"
            labelClassName="bg-transparent max-lg:bg-surface py-2 pl-1.5 sm:pl-2 flex flex-col justify-center"
            label={
              <>
                <span className="eyebrow block">Comparing</span>
                <span className="mt-0.5 block text-sm font-semibold text-ink tnum">
                  {products.length}
                  <span className="font-normal text-muted">/{MAX_COMPARE}</span>{" "}
                  <span className="font-medium">{category.shortName}</span>
                </span>
                <span className="mt-2 flex gap-1 lg:hidden">
                  <StepButton label="Previous product" onClick={() => step(-1)}>
                    <ChevronLeft className="size-4" aria-hidden />
                  </StepButton>
                  <StepButton label="Next product" onClick={() => step(1)}>
                    <ChevronRight className="size-4" aria-hidden />
                  </StepButton>
                </span>
              </>
            }
            addCell={
              canAdd ? (
                <motion.div layout={!reduce ? "position" : false} className="h-full p-1.5 sm:p-2">
                  <button
                    type="button"
                    onClick={onAdd}
                    className={cn(
                      "group flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-2xl",
                      "border border-dashed border-line-strong text-[13px] font-medium text-muted",
                      "transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98]",
                      "hover:border-accent/40 hover:bg-accent-soft hover:text-accent",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    )}
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-surface shadow-xs ring-1 ring-line transition-transform duration-150 group-hover:-translate-y-px">
                      <Plus className="size-4" aria-hidden />
                    </span>
                    <span>
                      Add<span className="hidden sm:inline"> {category.singular}</span>
                    </span>
                  </button>
                </motion.div>
              ) : null
            }
          >
            <AnimatePresence initial={false} mode="popLayout">
              {products.map((p) => (
                <motion.div
                  key={p.slug}
                  data-col
                  layout={!reduce}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                  transition={{ duration: reduce ? 0.01 : 0.28, ease: EASE }}
                  className="min-w-0 snap-start p-1 sm:p-1.5"
                >
                  <HeaderCell product={p} onRemove={onRemove} onReplace={onReplace} />
                </motion.div>
              ))}
            </AnimatePresence>
          </ColumnRow>
        </ColumnScroller>
      </div>
    </div>
  );
}

function HeaderCell({
  product: p,
  onRemove,
  onReplace,
}: {
  product: CompareProduct;
  onRemove: (slug: string) => void;
  onReplace: (slug: string) => void;
}) {
  return (
    <div className="flex h-full items-center gap-3 rounded-2xl p-1.5 transition-colors duration-150 hover:bg-surface/70">
      <ProductVisual product={p} size="sm" labelled={false} className="hidden w-16 shrink-0 sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate pt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">{p.brand}</p>
          <div className="-mr-1 -mt-1 flex shrink-0 items-center">
            <IconAction label={`Replace ${p.name}`} onClick={() => onReplace(p.slug)}>
              <ArrowLeftRight className="size-3.5" aria-hidden />
            </IconAction>
            <IconAction label={`Remove ${p.name}`} onClick={() => onRemove(p.slug)}>
              <X className="size-3.5" aria-hidden />
            </IconAction>
          </div>
        </div>
        <Link
          href={productHref(p)}
          className="line-clamp-2 rounded-sm text-[13px] font-semibold leading-snug text-ink transition-colors duration-150 hover:text-accent sm:text-sm"
        >
          {p.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <ScoreBadge score={p.score} size="sm" />
          <Price value={p.price} size="sm" />
        </div>
      </div>
    </div>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-full text-muted",
        "transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.94]",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
      )}
    >
      {children}
    </button>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="btn-glass grid size-7 place-items-center rounded-full text-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}
