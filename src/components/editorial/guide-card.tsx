import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatINR } from "@/lib/format";
import { ArtStage } from "./art-stage";
import type { GuideCardData } from "./types";

/** "Under ₹30,000" or "Any budget" */
export function budgetLabel(budgetMax?: number): string {
  return budgetMax ? `Under ${formatINR(budgetMax)}` : "Any budget";
}

export function BudgetBadge({ budgetMax }: { budgetMax?: number }) {
  return (
    <Badge tone={budgetMax ? "positive" : "neutral"}>
      <Wallet aria-hidden />
      {budgetLabel(budgetMax)}
    </Badge>
  );
}

interface GuideCardProps {
  guide: GuideCardData;
  className?: string;
  headingLevel?: "h2" | "h3";
}

/** Buying guide card: the picks drawn together, budget badge, title and pick count. */
export function GuideCard({ guide, className, headingLevel: H = "h3" }: GuideCardProps) {
  return (
    <article
      className={cn(
        "group relative card card-hover flex h-full flex-col overflow-hidden has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
        className,
      )}
    >
      <ArtStage arts={guide.arts} mode="group" className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <BudgetBadge budgetMax={guide.budgetMax} />
          <span className="text-xs font-medium text-muted">{guide.categoryName}</span>
        </div>
        <H className="mt-3 text-xl font-semibold leading-snug tracking-tight text-ink">
          <Link
            href={guide.href}
            className="outline-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:content-['']"
          >
            {guide.title}
          </Link>
        </H>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{guide.excerpt}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted">
          <span>
            {guide.pickCount} picks · Updated <time dateTime={guide.updatedAt}>{guide.updatedLabel}</time>
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-accent" aria-hidden>
            Read
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
