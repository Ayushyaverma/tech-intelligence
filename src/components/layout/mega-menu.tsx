"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown, GitCompareArrows, LayoutGrid } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CategoryIcon } from "@/components/ui/category-icon";
import { cn } from "@/lib/format";
import type { NavCategory } from "./search-index";

const OPEN_DELAY = 60;
const CLOSE_DELAY = 140;

/**
 * Desktop "Categories" dropdown. Opens on hover (with small intent delays)
 * or click/Enter; closes on Escape, outside click, focus leaving, or
 * choosing a link. The panel spans the header width (positioned against
 * the header bar, which is `relative`).
 */
export function MegaMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelId = useId();

  function schedule(next: boolean) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), next ? OPEN_DELAY : CLOSE_DELAY);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const close = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          clearTimeout(timer.current);
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
          open ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2/70 hover:text-ink",
        )}
      >
        Categories
        <ChevronDown
          className={cn("size-3.5 text-muted transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            className="absolute inset-x-0 top-full pt-2"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Container>
              <div className="glass grid gap-2 rounded-panel p-2 shadow-lg lg:grid-cols-[1fr_17rem]">
                <ul className="grid grid-cols-3 gap-1">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/category/${c.slug}`}
                        onClick={close}
                        className="group flex h-full gap-3.5 rounded-card p-3.5 transition-colors duration-150 hover:bg-surface/80 focus-visible:bg-surface/80"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink-2 shadow-xs transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:text-accent">
                          <CategoryIcon icon={c.icon} className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{c.name}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">
                            {c.tagline}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="relative flex flex-col justify-between overflow-hidden rounded-card border border-line bg-surface p-5">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent-soft blur-2xl"
                  />
                  <div className="relative">
                    <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                      <GitCompareArrows className="size-[18px]" aria-hidden />
                    </span>
                    <p className="mt-4 text-[15px] font-semibold tracking-tight text-ink">Compare up to five</p>
                    <p className="mt-1 text-[13px] leading-snug text-muted">
                      Line devices up side by side — specs, scores and price history on one screen.
                    </p>
                  </div>
                  <div className="relative mt-5 flex flex-col gap-1.5">
                    <Link
                      href="/compare"
                      onClick={close}
                      className="group inline-flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
                    >
                      Start comparing
                      <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                    <Link
                      href="/category"
                      onClick={close}
                      className="group inline-flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LayoutGrid className="size-4 text-muted" aria-hidden />
                        All categories
                      </span>
                      <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
