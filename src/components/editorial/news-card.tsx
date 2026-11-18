import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/format";
import { ArtStage } from "./art-stage";
import { NEWS_KINDS } from "./news-kind";
import type { ArticleCardData } from "./types";

interface NewsCardProps {
  article: ArticleCardData;
  /** "lead": hero story. "standard": grid card. "side": horizontal card with a small visual. */
  variant?: "lead" | "standard" | "side";
  className?: string;
  /** heading level for the title */
  headingLevel?: "h2" | "h3";
}

/** Lifts on hover; shows a focus ring when the stretched title link is focused. */
const SHELL =
  "group relative card card-hover overflow-hidden has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent";

/** Title link whose ::after covers the whole card, so the card is one big target. */
function TitleLink({ article }: { article: ArticleCardData }) {
  return (
    <Link
      href={article.href}
      className="outline-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:content-['']"
    >
      {article.title}
    </Link>
  );
}

export function ArticleMeta({ article, className }: { article: ArticleCardData; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted", className)}>
      <time dateTime={article.publishedAt}>{article.dateLabel}</time>
      <span aria-hidden className="text-subtle">
        ·
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3" aria-hidden />
        {article.readMinutes} min read
      </span>
    </p>
  );
}

export function KindBadge({ kind, categoryName }: { kind: ArticleCardData["kind"]; categoryName?: string }) {
  const meta = NEWS_KINDS[kind];
  const Icon = meta.icon;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge tone={meta.tone}>
        <Icon aria-hidden />
        {meta.label}
      </Badge>
      {categoryName && <span className="text-xs font-medium text-muted">{categoryName}</span>}
    </span>
  );
}

/** News story card in three layouts. Server and client safe. */
export function NewsCard({ article, variant = "standard", className, headingLevel = "h3" }: NewsCardProps) {
  const H = headingLevel;

  if (variant === "lead") {
    return (
      <article className={cn(SHELL, "grid rounded-panel md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]", className)}>
        <ArtStage arts={article.arts} mode="group" className="aspect-[4/3] md:order-2 md:aspect-auto md:min-h-[26rem]" />
        <div className="flex flex-col p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-accent">Lead story</span>
          </div>
          <div className="mt-4">
            <KindBadge kind={article.kind} categoryName={article.categoryName} />
          </div>
          <H className="mt-4 text-2xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-3xl lg:text-[2.35rem]">
            <TitleLink article={article} />
          </H>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-[17px]">{article.excerpt}</p>
          <div className="mt-auto flex items-end justify-between gap-4 pt-8">
            <div className="flex items-center gap-3">
              <Initials name={article.author} />
              <div>
                <p className="text-sm font-medium text-ink">{article.author}</p>
                <ArticleMeta article={article} className="mt-0.5" />
              </div>
            </div>
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-bg shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              <ArrowUpRight className="size-5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "side") {
    return (
      <article className={cn(SHELL, "flex", className)}>
        <ArtStage arts={article.arts} className="min-h-32 w-28 shrink-0 sm:w-36" />
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <KindBadge kind={article.kind} categoryName={article.categoryName} />
          <H className="mt-2.5 line-clamp-3 text-[15px] font-semibold leading-snug tracking-tight text-ink sm:text-base">
            <TitleLink article={article} />
          </H>
          <ArticleMeta article={article} className="mt-auto pt-3" />
        </div>
      </article>
    );
  }

  return (
    <article className={cn(SHELL, "flex h-full flex-col", className)}>
      <ArtStage arts={article.arts} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5">
        <KindBadge kind={article.kind} categoryName={article.categoryName} />
        <H className="mt-3 text-lg font-semibold leading-snug tracking-tight text-ink">
          <TitleLink article={article} />
        </H>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{article.excerpt}</p>
        <ArticleMeta article={article} className="mt-auto pt-4" />
      </div>
    </article>
  );
}

/** Author monogram, e.g. "IS" for Ishita Sen. */
export function Initials({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent ring-1 ring-inset ring-accent/15",
        className,
      )}
    >
      {letters}
    </span>
  );
}
