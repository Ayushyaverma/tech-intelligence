import { useId } from "react";
import { cn } from "@/lib/format";

const TONE_COLORS = {
  positive: "var(--positive)",
  negative: "var(--negative)",
  neutral: "var(--subtle)",
} as const;

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
  /**
   * "auto" colours by direction from a price point of view:
   * falling = positive (green), rising = negative (orange), flat = neutral.
   */
  tone?: "auto" | "positive" | "negative" | "neutral";
}

/** Tiny price-trend line with a soft fill and an end dot. Server-safe (pure SVG). */
export function Sparkline({ points, width = 96, height = 28, className, tone = "auto" }: SparklineProps) {
  const gid = `spark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (points.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line x1={2} x2={width - 2} y1={height / 2} y2={height / 2} stroke="var(--line-strong)" strokeDasharray="2 3" />
      </svg>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const change = first ? (last - first) / first : 0;
  const resolved = tone === "auto" ? (change <= -0.005 ? "positive" : change >= 0.005 ? "negative" : "neutral") : tone;
  const color = TONE_COLORS[resolved];

  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / span) * (height - pad * 2));
  const coords = points.map((v, i) => [x(i), y(v)] as const);
  const line = coords.map(([cx, cy], i) => `${i ? "L" : "M"}${cx.toFixed(1)} ${cy.toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${height} L${x(0).toFixed(1)} ${height} Z`;
  const [ex, ey] = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r={2.75} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  );
}
