"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { useCompare } from "@/components/compare/compare-provider";
import { cn } from "@/lib/format";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { PRIMARY_NAV } from "./site";
import type { NavCategory } from "./search-index";
import { ThemeToggle } from "./theme-toggle";
import { useModal } from "./use-modal";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  categories: NavCategory[];
}

/** Full-height glass sheet for < lg screens. */
export function MobileNav({ open, onClose, onSearch, categories }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && <Sheet key="sheet" onClose={onClose} onSearch={onSearch} categories={categories} />}
    </AnimatePresence>
  );
}

function Sheet({ onClose, onSearch, categories }: Omit<MobileNavProps, "open">) {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { count } = useCompare();
  // Release scroll lock / focus as soon as the exit animation starts, not after it.
  const isPresent = useIsPresent();
  useModal(isPresent, sheetRef, onClose);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className={cn("fixed inset-0 z-[60] lg:hidden", !isPresent && "pointer-events-none")}>
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[rgba(12,13,16,0.22)] backdrop-blur-[4px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        onClick={onClose}
      />
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="glass absolute inset-2 flex flex-col overflow-hidden rounded-panel shadow-lg"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
          <Logo onClick={onClose} />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-full text-ink-2 transition-[background-color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
          <button
            type="button"
            onClick={onSearch}
            className="btn-glass flex h-12 w-full items-center gap-3 rounded-full px-4 text-left text-[15px] text-muted"
          >
            <Search className="size-[18px]" aria-hidden />
            Search products and news
          </button>

          <ul className="mt-5 divide-y divide-line">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  onClick={onClose}
                  className="group flex items-center justify-between gap-3 py-3.5"
                  activeClassName="[&_.label]:text-accent"
                >
                  <span>
                    <span className="label flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
                      {item.label}
                      {item.href === "/compare" && count > 0 && (
                        <span className="tnum grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
                          {count}
                        </span>
                      )}
                    </span>
                    {item.description && <span className="mt-0.5 block text-sm text-muted">{item.description}</span>}
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden
                  />
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-baseline justify-between">
            <p className="eyebrow">Categories</p>
            <Link href="/category" onClick={onClose} className="rounded-md text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  onClick={onClose}
                  className="card flex h-full items-center gap-3 p-3 transition-[transform,box-shadow] duration-150 hover:shadow-md active:scale-[0.98]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">
                    <CategoryIcon icon={c.icon} className="size-[18px]" />
                  </span>
                  <span className="text-sm font-medium text-ink">{c.shortName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-between border-t border-line px-3 py-2">
          <div className="flex gap-1 text-sm">
            <Link href="/about" onClick={onClose} className="rounded-full px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink">
              About
            </Link>
            <Link href="/methodology" onClick={onClose} className="rounded-full px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink">
              Methodology
            </Link>
          </div>
          <ThemeToggle showLabel />
        </div>
      </motion.div>
    </div>
  );
}
