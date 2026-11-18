import { Star } from "lucide-react";
import { cn } from "@/lib/format";

interface StarsProps {
  /** 0–5, fractions allowed */
  value: number;
  /** icon size in px */
  size?: number;
  className?: string;
}

/** Five-star rating with fractional fill. */
export function Stars({ value, size = 14, className }: StarsProps) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rated ${v.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
            <Star className="absolute inset-0 text-line-strong" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="text-warning" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
