"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductVisual } from "@/components/product-visual";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Chip } from "@/components/ui/chip";
import { Price } from "@/components/ui/price";
import { ScoreBadge } from "@/components/ui/score";
import { CATEGORIES, requireCategory } from "@/lib/categories";
import type { CategorySlug } from "@/lib/types";
import { cn } from "@/lib/format";
import type { CompareProduct } from "./types";

export type PickerMode = { kind: "add" } | { kind: "replace"; slug: string };

interface ComparePickerProps {
  open: boolean;
  mode: PickerMode;
  products: CompareProduct[];
  /** locked category (current selection), or null to let the user choose */
  category: CategorySlug | null;
  selected: string[];
  onPick: (product: CompareProduct) => void;
  onClose: () => void;
}

/**
 * Glass dialog for adding or replacing a product. When a selection exists the
 * category is locked, so comparisons always stay within one category.
 */
export function ComparePicker({ open, mode, products, category, selected, onPick, onClose }: ComparePickerProps) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<CategorySlug>(category ?? "phones");
  const inputRef = useRef<HTMLInputElement>(null);
  const active = category ?? chosen;

  // Reset the search each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      if (category) setChosen(category);
    }
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.category === active)
      .filter((p) => !q || `${p.brand} ${p.name} ${p.tagline}`.toLowerCase().includes(q))
      .sort((a, b) => b.score - a.score);
  }, [products, active, query]);

  const cat = requireCategory(active);
  const title = mode.kind === "replace" ? "Replace product" : "Add a product";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-start sm:pt-[10vh]">
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
            className="glass relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-panel sm:max-w-xl sm:rounded-panel"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <div>
                <h2 id="picker-title" className="text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                <p className="text-sm text-muted">
                  {category ? `Showing ${cat.name.toLowerCase()} — comparisons stay within one category.` : "Pick a category to start."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {!category && (
              <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar" role="group" aria-label="Category">
                {CATEGORIES.map((c) => (
                  <Chip key={c.slug} selected={chosen === c.slug} onClick={() => setChosen(c.slug)}>
                    <CategoryIcon icon={c.icon} className="size-3.5" />
                    {c.shortName}
                  </Chip>
                ))}
              </div>
            )}

            <div className="px-5 pt-4">
              <label className="relative block">
                <span className="sr-only">Search {cat.name.toLowerCase()}</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${cat.name.toLowerCase()}…`}
                  className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none transition-shadow placeholder:text-subtle focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)]"
                />
              </label>
            </div>

            <ul className="mt-3 flex-1 overflow-y-auto px-3 pb-4" aria-label="Products">
              {list.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted">No matches. Try another search.</li>}
              {list.map((p) => {
                const taken = selected.includes(p.slug);
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      disabled={taken}
                      onClick={() => onPick(p)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors duration-150",
                        taken ? "cursor-not-allowed opacity-50" : "hover:bg-surface-2 focus-visible:bg-surface-2",
                      )}
                    >
                      <ProductVisual product={p} size="sm" className="size-14 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-muted">{p.brand}</span>
                        <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                        <Price value={p.price} size="sm" className="text-ink-2" />
                      </span>
                      {taken ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                          <Check className="size-3.5" aria-hidden /> Added
                        </span>
                      ) : (
                        <ScoreBadge score={p.score} size="sm" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
