"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { DeviceArt, type DeviceVariant } from "@/components/device-art";
import type { CategorySlug, Product } from "@/lib/types";
import { cn } from "@/lib/format";

interface HeroGalleryProps {
  name: string;
  category: CategorySlug;
  art: Product["art"];
  colors: Product["colors"];
  variant?: DeviceVariant;
}

function distance(a: string, b: string) {
  const p = (h: string) => {
    const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [x, y] = [p(a), p(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/**
 * Large hero visual with colour swatches. Picking a swatch recolours the
 * generated device render (a real photo, when set, is shown as-is).
 */
export function HeroGallery({ name, category, art, colors, variant }: HeroGalleryProps) {
  const reduce = useReducedMotion();
  // The swatch closest to the curated art colour starts selected; it keeps the
  // curated tone, other swatches use their own hex.
  const initial = colors.length
    ? colors.reduce((best, c, i) => (distance(c.hex, art.primary) < distance(colors[best].hex, art.primary) ? i : best), 0)
    : -1;
  const [selected, setSelected] = useState(initial);
  const body = selected === initial || selected < 0 ? art.primary : colors[selected].hex;
  const colourName = selected >= 0 ? colors[selected]?.name : undefined;
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Radio-group keyboard behaviour: arrows move (and select) the swatch.
  function onSwatchKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (selected + step + colors.length) % colors.length;
    setSelected(next);
    swatchRefs.current[next]?.focus();
  }

  return (
    <div
      className="relative isolate overflow-hidden rounded-hero border border-line shadow-sm"
      style={{
        background: `radial-gradient(60% 55% at 50% 42%, color-mix(in oklab, ${art.accent} 26%, transparent), transparent 70%),
          radial-gradient(45% 40% at 12% 88%, color-mix(in oklab, ${art.primary} 14%, transparent), transparent 70%),
          radial-gradient(40% 35% at 90% 8%, color-mix(in oklab, ${art.accent} 14%, transparent), transparent 70%),
          linear-gradient(180deg, var(--surface), var(--surface-2))`,
      }}
    >
      {/* faint dot grid that fades out toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(70% 60% at 50% 45%, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 45%, #000, transparent 75%)",
        }}
      />

      <div className="grid px-6 pb-24 pt-10 sm:px-12 sm:pb-28 sm:pt-14 [&>*]:col-start-1 [&>*]:row-start-1">
        {art.image ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={art.image}
              alt={name}
              fill
              sizes="(min-width: 1024px) 600px, 92vw"
              loading="eager"
              fetchPriority="high"
              className="object-contain drop-shadow-[0_24px_32px_rgba(16,18,24,0.2)]"
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <motion.div
              key={body}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.01 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <DeviceArt
                category={category}
                primary={body}
                accent={art.accent}
                variant={variant}
                title={`${name}${colourName ? ` in ${colourName}` : ""} (illustration)`}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {!art.image && (
        <span className="absolute left-4 top-4 rounded-full bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-line backdrop-blur-sm sm:left-6 sm:top-6">
          Illustration · not a product photo
        </span>
      )}

      {colors.length > 0 && (
        <div className="absolute inset-x-0 bottom-5 flex justify-center px-4 sm:bottom-6">
          <div className="glass flex max-w-full items-center gap-3 rounded-full py-1.5 pl-2 pr-4">
            <div role="radiogroup" aria-label="Colour" onKeyDown={onSwatchKey} className="flex items-center gap-1.5">
              {colors.map((c, i) => {
                const active = i === selected;
                return (
                  <button
                    key={c.name}
                    ref={(el) => {
                      swatchRefs.current[i] = el;
                    }}
                    type="button"
                    tabIndex={active ? 0 : -1}
                    role="radio"
                    aria-checked={active}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setSelected(i)}
                    className={cn(
                      "relative grid size-8 place-items-center rounded-full transition-transform duration-150 active:scale-95",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                      !active && "hover:scale-105",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="hero-swatch-ring"
                        aria-hidden
                        className="absolute inset-0 rounded-full ring-2 ring-ink/70"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span
                      aria-hidden
                      className="size-6 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_2px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.12)]"
                      style={{ background: `linear-gradient(145deg, color-mix(in oklab, ${c.hex} 70%, white), ${c.hex} 55%)` }}
                    />
                  </button>
                );
              })}
            </div>
            {colourName && (
              <span className="min-w-0 truncate text-[13px] font-medium text-ink-2" aria-live="polite">
                {colourName}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
