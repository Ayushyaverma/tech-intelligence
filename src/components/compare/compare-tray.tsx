"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { DeviceArt } from "@/components/device-art";
import { buttonClasses } from "@/components/ui/button";
import { requireCategory } from "@/lib/categories";
import { compareHref } from "@/lib/product-utils";
import { cn } from "@/lib/format";
import { COMPARE_MAX, useCompare } from "./compare-provider";

/** Floating glass bar showing the current comparison selection. Mount once in the root layout. */
export function CompareTray() {
  const pathname = usePathname();
  const { items, count, category, remove, clear } = useCompare();
  const reduce = useReducedMotion();

  const hiddenRoute = pathname?.startsWith("/compare") || pathname?.startsWith("/admin");
  const visible = count > 0 && !hiddenRoute;
  const ready = count >= 2;
  const catName = category ? requireCategory(category).shortName : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="compare-tray"
          role="region"
          aria-label="Comparison selection"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: reduce ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 z-[60] mx-auto w-fit max-w-[calc(100vw-1.5rem)] px-0"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          <div className="glass flex items-center gap-2 rounded-[22px] p-2 sm:gap-3 sm:pl-3">
            {/* selected thumbnails + empty slots */}
            <ul className="flex min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar">
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((item) => (
                  <motion.li
                    key={item.slug}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                    transition={{ duration: reduce ? 0.01 : 0.2 }}
                    className="group relative shrink-0"
                  >
                    <div
                      className="grid size-12 place-items-center overflow-hidden rounded-xl bg-surface ring-1 ring-line sm:size-14"
                      title={`${item.brand} ${item.name}`}
                      style={{
                        background: `radial-gradient(circle at 50% 45%, color-mix(in oklab, ${item.art.accent} 18%, transparent), transparent 70%), var(--surface)`,
                      }}
                    >
                      <DeviceArt
                        category={item.category}
                        primary={item.art.primary}
                        accent={item.art.accent}
                        variant={item.variant}
                        className="w-[115%] max-w-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.slug)}
                      aria-label={`Remove ${item.name} from comparison`}
                      className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-bg shadow-sm transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                    >
                      <X className="size-3" strokeWidth={2.5} aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {Array.from({ length: COMPARE_MAX - count }, (_, i) => (
                <li
                  key={`slot-${i}`}
                  aria-hidden
                  className="hidden size-14 shrink-0 rounded-xl border border-dashed border-line-strong md:block"
                />
              ))}
            </ul>

            <div className="hidden min-w-0 flex-col px-1 leading-tight sm:flex">
              <span className="text-sm font-semibold text-ink tnum">
                {count}/{COMPARE_MAX} <span className="font-normal text-muted">{catName}</span>
              </span>
              <span className="text-xs text-muted" aria-live="polite">
                {ready ? "Ready to compare" : "Add one more to compare"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={clear}
                className={buttonClasses("ghost", "sm", "hidden sm:inline-flex")}
              >
                Clear
              </button>
              {ready ? (
                <Link href={compareHref(items.map((i) => i.slug))} className={buttonClasses("accent", "md")}>
                  Compare
                  <span className="sm:hidden tnum">({count})</span>
                  <ArrowRight aria-hidden />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={cn(buttonClasses("accent", "md"), "disabled:opacity-60")}
                  title="Select at least two products"
                >
                  Compare
                  <span className="tnum">
                    {count}/{COMPARE_MAX}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={clear}
                aria-label="Clear comparison"
                className="grid size-9 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink sm:hidden"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
