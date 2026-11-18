"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DeviceArt, type DeviceVariant } from "@/components/device-art";
import type { CategorySlug, ProductArt } from "@/lib/types";
import { cn } from "@/lib/format";

export interface NavSection {
  id: string;
  label: string;
}

interface SectionNavProps {
  sections: NavSection[];
  product: {
    name: string;
    priceText: string;
    category: CategorySlug;
    art: ProductArt;
    variant?: DeviceVariant;
  };
  /** id of the "where to buy" section, for the compact buy button */
  buyId?: string;
}

/** Distance (px) from the viewport top at which a section counts as "current". */
const SPY_OFFSET = 160;
/** Sticky offset: sits just below the 64px site header. */
const STICK_TOP = 72;

/**
 * Sticky in-page navigation with scroll-spy. Once it sticks, a compact
 * product identity (art, name, price) and a "Where to buy" shortcut slide in.
 */
export function SectionNav({ sections, product, buyId }: SectionNavProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(sections[0]?.id);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const lockUntil = useRef(0);

  // "Stuck" = the sentinel just above the bar has scrolled under the header.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(e.boundingClientRect.top < STICK_TOP + 1), {
      rootMargin: `-${STICK_TOP + 1}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll-spy: the last section whose top has passed the offset is active.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (performance.now() < lockUntil.current) return;
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - SPY_OFFSET <= 0) current = s.id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sections.at(-1)?.id ?? current;
      if (current) setActive(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  // Keep the active pill visible inside the horizontally scrolling list (phones).
  useEffect(() => {
    const ul = list.current;
    const item = ul?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!ul || !item || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollTo({
      left: item.offsetLeft - ul.clientWidth / 2 + item.clientWidth / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active, reduce]);

  function onJump(id: string, at: number) {
    setActive(id);
    // Ignore the spy while the smooth scroll travels past other sections.
    lockUntil.current = at + 900; // event.timeStamp shares performance.now()'s clock
  }

  const fade = { duration: reduce ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px" />
      <nav aria-label="On this page" className="sticky z-40" style={{ top: STICK_TOP }}>
        <div className="glass flex items-center gap-1.5 rounded-full p-1.5">
          <AnimatePresence initial={false}>
            {stuck && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={fade}
                className="hidden shrink-0 overflow-hidden lg:block"
              >
                <div className="flex items-center gap-2.5 whitespace-nowrap border-r border-line pl-1 pr-4">
                  <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                    <DeviceArt
                      category={product.category}
                      primary={product.art.primary}
                      accent={product.art.accent}
                      variant={product.variant}
                      className="w-12 max-w-none"
                    />
                  </span>
                  <span className="leading-tight">
                    <span className="block max-w-44 truncate text-[13px] font-semibold text-ink">{product.name}</span>
                    <span className="block text-xs text-muted tnum">{product.priceText}</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ul ref={list} className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scroll-px-2">
            {sections.map((s) => {
              const isActive = s.id === active;
              return (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => onJump(s.id, e.timeStamp)}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "relative inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                      isActive ? "text-ink" : "text-muted hover:bg-surface-2/70 hover:text-ink",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="product-section-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-surface shadow-sm ring-1 ring-line"
                        style={{ backgroundImage: "linear-gradient(180deg, var(--glass-highlight), transparent 60%)" }}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 40, mass: 0.8 }}
                      />
                    )}
                    <span className="relative">{s.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          <AnimatePresence initial={false}>
            {stuck && buyId && (
              <motion.a
                key="buy"
                href={`#${buyId}`}
                onClick={(e) => onJump(buyId, e.timeStamp)}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                transition={fade}
                className="btn-accent hidden h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex"
              >
                <ShoppingBag className="size-3.5" aria-hidden />
                Where to buy
              </motion.a>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
