import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCompareArrows, Hash, Info, ListTree } from "lucide-react";
import { ArtStage } from "@/components/editorial/art-stage";
import { ArticleBody } from "@/components/editorial/article-body";
import { extractHeadings, productMap, toArticleCard, toArtRef } from "@/components/editorial/build";
import { dateLong } from "@/components/editorial/dates";
import { Initials, KindBadge, NewsCard } from "@/components/editorial/news-card";
import { SourcesList } from "@/components/editorial/sources-list";
import { SITE_NAME, SITE_URL } from "@/components/layout/site";
import { ProductCard } from "@/components/product-card";
import { AdSlot } from "@/components/ui/ad-slot";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { getCategory } from "@/lib/categories";
import { getArticle, getNews, getProducts, getProductsBySlugs, getSettings } from "@/lib/data";
import { compareHref, computeScore } from "@/lib/product-utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const news = await getNews();
  // Cache Components needs at least one param; the placeholder resolves to a 404.
  return news.length ? news.map((a) => ({ slug: a.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Story not found", robots: { index: false } };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags,
    },
  };
}

async function ArticlePageContent({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const [related, allNews, products, settings] = await Promise.all([
    getProductsBySlugs(article.productSlugs),
    getNews(),
    getProducts(),
    getSettings(),
  ]);
  const bySlug = productMap(products);
  const category = article.category ? getCategory(article.category) : undefined;
  const headings = extractHeadings(article.body);

  // "Compare these" only makes sense when the related products share a category.
  const compareGroup = related.filter((p) => p.category === related[0]?.category);
  const canCompare = compareGroup.length >= 2;

  // More stories: same category first, then the newest of the rest.
  const others = allNews.filter((a) => a.slug !== article.slug);
  const more = [
    ...others.filter((a) => article.category && a.category === article.category),
    ...others.filter((a) => !article.category || a.category !== article.category),
  ]
    .slice(0, 3)
    .map((a) => toArticleCard(a, bySlug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL.replace(/\/$/, "")}/news/${article.slug}`,
    keywords: article.tags.join(", "),
    articleSection: category?.name,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[28rem] bg-[radial-gradient(50%_60%_at_50%_0%,var(--accent-soft),transparent_70%)]"
        />
        <Container className="pt-6 sm:pt-8">
          <Breadcrumbs
            items={[{ href: "/", label: "Home" }, { href: "/news", label: "News" }, { label: article.title }]}
          />
          <Reveal className="mx-auto mt-10 max-w-4xl text-center sm:mt-14">
            <div className="flex justify-center">
              <KindBadge kind={article.kind} categoryName={category?.shortName} />
            </div>
            <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              {article.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{article.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-2.5">
                <Initials name={article.author} />
                <span className="font-medium text-ink">{article.author}</span>
              </span>
              <span aria-hidden className="hidden h-4 w-px bg-line-strong sm:block" />
              <span className="text-muted">
                <time dateTime={article.publishedAt}>{dateLong(article.publishedAt)}</time>
                <span aria-hidden className="mx-2 text-subtle">
                  ·
                </span>
                {article.readMinutes} min read
              </span>
            </div>
          </Reveal>

          {related.length > 0 && (
            <Reveal delay={0.08} className="mt-10 sm:mt-14">
              <ArtStage
                arts={related.map(toArtRef)}
                mode="group"
                labelled
                className="aspect-[4/3] rounded-hero border border-line shadow-sm sm:aspect-[2/1] lg:aspect-[21/9]"
              />
            </Reveal>
          )}
        </Container>
      </header>

      <Container className="mt-12 sm:mt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 lg:pl-[max(0px,calc((100%-68ch)/2))]">
            <ArticleBody paragraphs={article.body} />

            {article.tags.length > 0 && (
              <ul className="mt-10 flex max-w-[68ch] flex-wrap gap-2" aria-label="Tags">
                {article.tags.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/search?q=${encodeURIComponent(t)}`}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-surface px-3 text-[13px] font-medium text-ink-2 shadow-xs ring-1 ring-inset ring-line transition-[background-color,color] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.98]"
                    >
                      <Hash className="size-3.5 text-subtle" aria-hidden />
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {settings.demoMode && (
              <p className="mt-8 flex max-w-[68ch] items-start gap-2.5 rounded-card bg-warning-soft p-4 text-sm leading-relaxed text-ink-2">
                <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <span>
                  Sample story. Brands, products, prices and quotes on this site are fictional and for illustration
                  only.
                </span>
              </p>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Story tools">
            {headings.length > 0 && (
              <nav aria-labelledby="toc-heading" className="hidden lg:block">
                <p id="toc-heading" className="eyebrow flex items-center gap-1.5">
                  <ListTree className="size-3.5" aria-hidden />
                  In this story
                </p>
                <ol className="mt-4 space-y-1 border-l border-line">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted transition-colors duration-150 hover:border-ink hover:text-ink"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {related.length > 0 && (
              <div className="card p-5 lg:mt-10">
                <p className="text-sm font-semibold text-ink">Products in this story</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Scores and prices update as we re-check them.
                </p>
                <ul className="mt-4 space-y-2">
                  {related.map((p) => (
                    <li key={p.slug}>
                      <ProductCard product={p} score={computeScore(p, settings)} variant="compact" />
                    </li>
                  ))}
                </ul>
                {canCompare && (
                  <ButtonLink
                    href={compareHref(compareGroup.slice(0, 5).map((p) => p.slug))}
                    variant="glass"
                    size="md"
                    className="mt-4 w-full"
                  >
                    <GitCompareArrows aria-hidden />
                    Compare {Math.min(compareGroup.length, 5)} side by side
                  </ButtonLink>
                )}
              </div>
            )}
          </aside>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-6">
            <SourcesList sources={article.sources} />
            <AdSlot id="guides-articles" />
          </div>
        </div>
      </Container>

      {more.length > 0 && (
        <Container as="section" className="mt-24 sm:mt-28">
          <SectionHeader eyebrow="Keep reading" title="More stories" action={{ href: "/news", label: "All news" }} />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((a) => (
              <StaggerItem key={a.slug}>
                <NewsCard article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      )}
    </article>
  );
}

/**
 * The params-dependent content sits inside <Suspense> so Next can also prerender
 * this route's generic fallback shell (used for slugs added after the build and
 * when pages regenerate after an admin edit). Known slugs still prerender fully.
 */
export default function ArticlePage({ params }: { params: Props["params"] }) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <ArticlePageContent params={params} />
    </Suspense>
  );
}

function RouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-56" />
      <div className="skeleton h-12 w-full max-w-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton aspect-[4/3] rounded-panel" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-24" />
          <div className="skeleton h-40" />
        </div>
      </div>
    </div>
  );
}
