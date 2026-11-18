import { ArrowUpRight, BadgeCheck, BookOpen, Gauge, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import type { Source, SourceType } from "@/lib/types";
import { cn } from "@/lib/format";
import { dateMedium } from "./dates";

const TYPES: Record<SourceType, { label: string; icon: LucideIcon }> = {
  official: { label: "Official", icon: BadgeCheck },
  review: { label: "Review", icon: BookOpen },
  benchmark: { label: "Benchmark", icon: Gauge },
  retailer: { label: "Retailer / price", icon: ShoppingBag },
  user: { label: "User reports", icon: Users },
};

interface SourcesListProps {
  sources: Source[];
  className?: string;
  /** heading id, for aria-labelledby / in-page links */
  id?: string;
}

/** Numbered source list with type, publisher and the date each source was checked. */
export function SourcesList({ sources, className, id = "sources" }: SourcesListProps) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby={id} className={cn("rounded-panel border border-line bg-surface p-6 shadow-xs sm:p-8", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-ink">
          Sources
        </h2>
        <p className="text-xs text-muted">Every claim is traced to a source and the date we checked it.</p>
      </div>
      <ol className="mt-5 divide-y divide-line">
        {sources.map((s, i) => {
          const type = TYPES[s.type];
          const Icon = type.icon;
          return (
            <li key={s.id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
              <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-semibold text-subtle tnum">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="group inline-flex items-start gap-1 rounded-sm text-[15px] font-medium text-ink transition-colors duration-150 hover:text-accent"
                >
                  <span>{s.title}</span>
                  <ArrowUpRight
                    className="mt-1 size-3.5 shrink-0 text-subtle transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-accent"
                    aria-hidden
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                    <Icon className="size-3.5" aria-hidden />
                    {type.label}
                  </span>
                  <span aria-hidden className="text-subtle">
                    ·
                  </span>
                  <span>{s.publisher}</span>
                  <span aria-hidden className="text-subtle">
                    ·
                  </span>
                  <span>
                    Checked <time dateTime={s.accessedAt}>{dateMedium(s.accessedAt)}</time>
                  </span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
