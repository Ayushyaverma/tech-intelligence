"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import type { ActivePill } from "./catalog-query";

interface ActiveFiltersProps {
  pills: ActivePill[];
  onRemove: (pill: ActivePill) => void;
  onClearAll: () => void;
}

/** Removable pills for every filter in use, plus "Clear all". */
export function ActiveFilters({ pills, onRemove, onClearAll }: ActiveFiltersProps) {
  const reduce = useReducedMotion();
  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      <AnimatePresence initial={false} mode="popLayout">
        {pills.map((pill) => (
          <motion.button
            key={pill.id}
            type="button"
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: reduce ? 0.01 : 0.18 }}
            onClick={() => onRemove(pill)}
            aria-label={`Remove filter ${pill.label}`}
            className="group inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-accent-soft pl-3 pr-1.5 text-[13px] font-medium text-accent ring-1 ring-inset ring-accent/15 transition-colors duration-150 hover:bg-accent hover:text-accent-ink active:scale-[0.98]"
          >
            <span className="truncate">{pill.label}</span>
            <span className="grid size-5 place-items-center rounded-full bg-accent/10 transition-colors duration-150 group-hover:bg-white/20">
              <X className="size-3" strokeWidth={2.5} aria-hidden />
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={onClearAll}
        className="h-8 rounded-full px-2.5 text-[13px] font-medium text-muted underline-offset-4 transition-colors duration-150 hover:text-ink hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
