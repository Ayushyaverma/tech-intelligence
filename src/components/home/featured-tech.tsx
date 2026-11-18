import Link from "next/link";
import { ArrowUpRight, Clock, Newspaper } from "lucide-react";
import { DeviceArt, deviceVariant } from "@/components/device-art";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { getCategory } from "@/lib/categories";
import type { NewsArticle, Product } from "@/lib/types";
import { cn } from "@/lib/format";
import { HomeSection } from "./home-section";
import { KIND_LABELS, RADIUS, articleHref, shortDate, tintedBackdrop } from "./home-utils";
import { ProductThumb } from "./product-thumb";

export interface FeaturedStory {
  article: NewsArticle;
  /** first related product, used for the illustration */
  product?: Product;
}

/** Section 4: editorial bento — one lead story and four supporting ones. */
export function FeaturedTech({ stories }: { stories: FeaturedStory[] }) {
  const [lead, ...rest] = stories;
  return (
    <HomeSection
      id="featured"
      header={{
        eyebrow: "Featured technology",
        title: "Reviews and analysis worth your time",
        description: "Long-term reviews, industry shifts and the stories behind the spec sheets.",
        action: { href: "/news", label: "All stories" },
      }}
    >
      {lead ? (
        <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2" stagger={0.07}>
          <StaggerItem className="md:col-span-2 lg:row-span-2">
            <LeadStory story={lead} />
          </StaggerItem>
          {rest.map((s) => (
            <StaggerItem key={s.article.slug}>
              <StoryCard story={s} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No featured stories yet"
          description="Reviews and editorials will appear here once they're published."
          action={{ href: "/news", label: "Read the latest news" }}
        />
      )}
    </HomeSection>
  );
}

function Tags({ article }: { article: NewsArticle }) {
  const category = article.category ? getCategory(article.category) : undefined;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge tone={article.kind === "review" ? "accent" : "neutral"}>{KIND_LABELS[article.kind]}</Badge>
      {category && <Badge>{category.shortName}</Badge>}
    </span>
  );
}

function Meta({ article, className }: { article: NewsArticle; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted", className)}>
      <time dateTime={article.publishedAt} className="tnum">
        {shortDate(article.publishedAt)}
      </time>
      <span aria-hidden className="text-subtle">
        ·
      </span>
      <span className="inline-flex items-center gap-1 tnum">
        <Clock className="size-3.5" aria-hidden />
        {article.readMinutes} min read
      </span>
    </span>
  );
}

function LeadStory({ story: { article, product } }: { story: FeaturedStory }) {
  const art = product?.art ?? { primary: "#3b3c40", accent: "#8b93ff" };
  return (
    <Link
      href={articleHref(article.slug)}
      style={RADIUS.panel}
      className="card card-hover group flex h-full flex-col overflow-hidden rounded-panel"
    >
      <div
        className="relative grid min-h-56 flex-1 place-items-center overflow-hidden px-8 pt-8 sm:min-h-72"
        style={{ background: tintedBackdrop(art.accent, art.primary, 26) }}
      >
        {product && (
          <DeviceArt
            category={product.category}
            primary={art.primary}
            accent={art.accent}
            variant={deviceVariant(product)}
            className="w-full max-w-[24rem] translate-y-3 transition-transform duration-500 ease-out group-hover:translate-y-1 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-5 top-5">
          <Tags article={article} />
        </span>
      </div>
      <div className="p-5 sm:p-7">
        <h3 className="text-2xl font-semibold leading-tight tracking-tight text-ink transition-colors duration-150 group-hover:text-accent sm:text-[1.75rem]">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Meta article={article} />
          <span className="text-xs font-medium text-ink-2">By {article.author}</span>
        </div>
      </div>
    </Link>
  );
}

function StoryCard({ story: { article, product } }: { story: FeaturedStory }) {
  return (
    <Link
      href={articleHref(article.slug)}
      style={RADIUS.card}
      className="card card-hover group relative flex h-full min-h-52 flex-col overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <Tags article={article} />
        {product && <ProductThumb product={product} className="size-12 transition-transform duration-300 group-hover:scale-105" />}
      </div>
      <h3 className="mt-4 line-clamp-3 text-[17px] font-semibold leading-snug tracking-tight text-ink transition-colors duration-150 group-hover:text-accent">
        {article.title}
      </h3>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Meta article={article} />
        <ArrowUpRight
          className="size-4 text-subtle transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden
        />
      </div>
    </Link>
  );
}
