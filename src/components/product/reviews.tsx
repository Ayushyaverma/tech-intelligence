import { ArrowUpRight, MessageSquareQuote, Quote, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerItem, Stagger } from "@/components/ui/reveal";
import { Stars } from "@/components/ui/stars";
import type { ExpertReview, UserFeedback } from "@/lib/types";
import { cn } from "@/lib/format";
import { InitialAvatar } from "./avatar";
import { formatDay } from "./helpers";
import { SubHeading } from "./product-section";

function ratingTone(r: number) {
  if (r >= 8.5) return "bg-positive-soft text-positive ring-positive/20";
  if (r >= 7.5) return "bg-accent-soft text-accent ring-accent/20";
  return "bg-warning-soft text-warning ring-warning/20";
}

/** Linked, summarised expert reviews. Summaries are our paraphrase; the link goes to the full review. */
export function ExpertReviews({ reviews }: { reviews: ExpertReview[] }) {
  if (!reviews.length) {
    return (
      <EmptyState
        icon={Quote}
        title="No expert reviews linked yet"
        description="We add summaries and links once independent reviews are published."
      />
    );
  }
  const rated = reviews.filter((r) => typeof r.rating === "number");
  const avg = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : undefined;
  const sorted = [...reviews].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <SubHeading
        title="Expert reviews"
        description={
          avg !== undefined
            ? `Critics average ${avg.toFixed(1)}/10 across ${rated.length} rated review${rated.length === 1 ? "" : "s"}.`
            : "Summaries of independent reviews."
        }
      />
      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((r) => (
          <StaggerItem key={`${r.publisher}-${r.date}`} as="article" className="card card-hover flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <InitialAvatar name={r.publisher} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{r.publisher}</p>
                <p className="text-xs text-subtle">{formatDay(r.date)}</p>
              </div>
              {typeof r.rating === "number" && (
                <span
                  role="img"
                  aria-label={`Rated ${r.rating} out of 10`}
                  className={cn("inline-flex h-9 items-center rounded-[11px] px-2.5 font-semibold ring-1 ring-inset tnum", ratingTone(r.rating))}
                >
                  <span className="leading-none" aria-hidden>
                    <span className="text-base">{r.rating.toFixed(1)}</span>
                    <span className="ml-px text-[10px] font-medium opacity-60">/10</span>
                  </span>
                </span>
              )}
            </div>
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-2">
              <Quote className="mb-2 size-4 text-subtle" aria-hidden />
              {r.summary}
            </blockquote>
            <a
              href={r.url}
              target="_blank"
              rel="noopener nofollow"
              className="group mt-5 inline-flex items-center gap-1 self-start rounded-full text-[13px] font-medium text-accent transition-colors duration-150 hover:text-accent-strong"
            >
              Read the full review
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              <span className="sr-only">(opens {r.publisher} in a new tab)</span>
            </a>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

/** Aggregated owner sentiment: average, count and paraphrased recurring themes. */
export function UserExperiences({ feedback }: { feedback?: UserFeedback }) {
  return (
    <div>
      <SubHeading title="User experiences" description="Aggregated from owner reviews at retailers." />
      {!feedback || feedback.count === 0 ? (
        <EmptyState icon={Users} title="Not enough owner reviews yet" description="We summarise owner feedback once enough reviews are available." />
      ) : (
        <div className="card grid gap-6 p-6 sm:p-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
          <div>
            <p className="text-5xl font-semibold tracking-tight text-ink tnum">
              {feedback.average.toFixed(1)}
              <span className="text-lg font-medium text-subtle">/5</span>
            </p>
            <Stars value={feedback.average} size={18} className="mt-2" />
            <p className="mt-2 text-sm text-muted tnum">{feedback.count.toLocaleString("en-IN")} ratings</p>
            <RatingMeter value={feedback.average} />
          </div>
          <div>
            <p className="eyebrow">Recurring themes</p>
            <ul className="mt-3 space-y-2.5">
              {feedback.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 rounded-2xl bg-surface-2/70 px-4 py-3 text-sm text-ink-2 ring-1 ring-inset ring-line">
                  <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-subtle">Themes are paraphrased by our editors; individual reviews are not reproduced.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingMeter({ value }: { value: number }) {
  return (
    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <div className="h-full rounded-full bg-warning" style={{ width: `${(value / 5) * 100}%` }} />
    </div>
  );
}
