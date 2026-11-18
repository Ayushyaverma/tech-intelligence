import { scoreLabel, scoreTone } from "@/lib/product-utils";
import { cn } from "@/lib/format";

export { ScoreRing } from "./score-ring";

type Tone = ReturnType<typeof scoreTone>;

/** Tailwind classes per score tone. "low" stays neutral so weak scores aren't shouted. */
export const SCORE_TONE_CLASSES: Record<Tone, { badge: string; text: string; bar: string; stroke: string }> = {
  great: {
    badge: "bg-positive-soft text-positive ring-positive/20",
    text: "text-positive",
    bar: "bg-positive",
    stroke: "var(--positive)",
  },
  good: {
    badge: "bg-accent-soft text-accent ring-accent/20",
    text: "text-accent",
    bar: "bg-accent",
    stroke: "var(--accent)",
  },
  ok: {
    badge: "bg-warning-soft text-warning ring-warning/20",
    text: "text-warning",
    bar: "bg-warning",
    stroke: "var(--warning)",
  },
  low: {
    badge: "bg-surface-2 text-ink-2 ring-line-strong",
    text: "text-ink-2",
    bar: "bg-subtle",
    stroke: "var(--subtle)",
  },
};

const BADGE_SIZES = {
  sm: { box: "h-7 min-w-9 px-1.5 rounded-lg", num: "text-[13px]", of: "hidden" },
  md: { box: "h-9 min-w-12 px-2 rounded-[11px]", num: "text-base", of: "text-[10px]" },
  lg: { box: "h-12 min-w-16 px-3 rounded-[14px]", num: "text-2xl", of: "text-xs" },
} as const;

interface ScoreBadgeProps {
  score: number;
  size?: keyof typeof BADGE_SIZES;
  /** Show the word label ("Excellent") beside the number. */
  showLabel?: boolean;
  className?: string;
}

/** Platform score /100 as a tinted pill. */
export function ScoreBadge({ score, size = "md", showLabel = false, className }: ScoreBadgeProps) {
  const tone = SCORE_TONE_CLASSES[scoreTone(score)];
  const s = BADGE_SIZES[size];
  const rounded = Math.round(score);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("inline-flex items-center justify-center font-semibold tnum ring-1 ring-inset", s.box, tone.badge)}
        role="img"
        aria-label={`Score ${rounded} out of 100, ${scoreLabel(score)}`}
        title={`${scoreLabel(score)} · ${rounded}/100`}
      >
        <span className="leading-none" aria-hidden>
          <span className={cn("tracking-tight", s.num)}>{rounded}</span>
          <span className={cn("ml-px font-medium opacity-60", s.of)}>/100</span>
        </span>
      </span>
      {showLabel && (
        <span className={cn("font-medium", size === "lg" ? "text-base" : "text-sm", tone.text)}>{scoreLabel(score)}</span>
      )}
    </span>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
  /** Criterion weight in percent; shown as a muted suffix. */
  weight?: number;
  max?: number;
  className?: string;
}

/** Horizontal sub-score bar for scoring breakdowns. */
export function ScoreBar({ label, value, weight, max = 100, className }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tone = SCORE_TONE_CLASSES[scoreTone((value / max) * 100)];
  return (
    <div className={cn("group", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">
          {label}
          {weight !== undefined && <span className="ml-1.5 text-xs font-normal text-subtle tnum">{weight}%</span>}
        </span>
        <span className="font-semibold text-ink tnum">
          {Math.round(value)}
          <span className="text-xs font-normal text-subtle">/{max}</span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
