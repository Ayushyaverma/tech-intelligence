"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { scoreLabel, scoreTone } from "@/lib/product-utils";
import { cn } from "@/lib/format";

const STROKES = {
  great: "var(--positive)",
  good: "var(--accent)",
  ok: "var(--warning)",
  low: "var(--subtle)",
} as const;

interface ScoreRingProps {
  score: number;
  /** Outer diameter in px. */
  size?: number;
  stroke?: number;
  /** Caption under the number; defaults to the score label ("Excellent"). Pass "" to hide. */
  label?: string;
  className?: string;
}

/** Circular score gauge that draws itself the first time it scrolls into view. */
export function ScoreRing({ score, size = 120, stroke, label, className }: ScoreRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();

  const value = Math.max(0, Math.min(100, Math.round(score)));
  const sw = stroke ?? Math.max(4, Math.round(size / 14));
  const r = (size - sw) / 2;
  const color = STROKES[scoreTone(value)];
  const caption = label ?? scoreLabel(value);
  const big = size >= 96;

  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${value} out of 100, ${scoreLabel(value)}`}
    >
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? value / 100 : 0 }}
          animate={{ pathLength: inView || reduce ? value / 100 : 0 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center" aria-hidden>
        <span
          className="font-semibold leading-none tracking-tight text-ink tnum"
          style={{ fontSize: Math.round(size * (big ? 0.3 : 0.34)) }}
        >
          {value}
        </span>
        {big && caption && <span className="mt-1 text-[11px] font-medium text-muted">{caption}</span>}
      </div>
    </div>
  );
}
