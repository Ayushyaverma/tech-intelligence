import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, Award, GitCompareArrows, HandCoins } from "lucide-react";
import { ArticleBody } from "@/components/editorial/article-body";
import { fullName, productMap, splitIntro, toGuideCard } from "@/components/editorial/build";
import { dateLong } from "@/components/editorial/dates";
import { BudgetBadge, GuideCard } from "@/components/editorial/guide-card";
import { Initials } from "@/components/editorial/news-card";
import { SITE_NAME, SITE_URL } from "@/components/layout/site";
import { ProductCard } from "@/components/product-card";
import { AdSlot } from "@/components/ui/ad-slot";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { Price } from "@/components/ui/price";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { ScoreBadge } from "@/components/ui/score";
import { SectionHeader } from "@/components/ui/section-header";
import { requireCategory } from "@/lib/categories";
import { getGuide, getGuides, getProducts, getProductsBySlugs, getSettings } from "@/lib/data";
import { compareHref, computeScore, currentPrice } from "@/lib/product-utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const guides = await getGuides();
  // Cache Components needs at least one param; the placeholder resolves to a 404.
  return guides.length ? guides.map((g) => ({ slug: g.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found", robots: { index: false } };
  return {
    title: guide.title,
    description: guide.excerpt,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { type: "article", title: guide.title, description: guide.excerpt, modifiedTime: guide.updatedAt },
  };
}

async function GuidePageContent({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  const [pickProducts, settings, allGuides, products] = await Promise.all([
    getProductsBySlugs(guide.picks.map((p) => p.productSlug)),
    getSettings(),
    getGuides(),
    getProducts(),
  ]);
  const category = requireCategory(guide.category);

  // Keep the editor's order; drop picks whose product is no longer published.
  const picks = guide.picks
    .map((pick) => ({ pick, product: pickProducts.find((p) => p.slug === pick.productSlug) }))
    .filter((x): x is { pick: (typeof guide.picks)[number]; product: (typeof pickProducts)[number] } => !!x.product)
    .map((x, i) => ({ ...x, rank: i + 1, score: computeScore(x.product, settings), price: currentPrice(x.product) }));

  const compareUrl = compareHref(picks.slice(0, 5).map((p) => p.product.slug));
  const { intro, rest } = splitIntro(guide.body);

  const bySlug = productMap(products);
  const otherGuides = allGuides.filter((g) => g.slug !== guide.slug);
  const related = [
    ...otherGuides.filter((g) => g.category === guide.category),
    ...otherGuides.filter((g) => g.category !== guide.category),
  ]
    .slice(0, 3)
    .map((g) => toGuideCard(g, bySlug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: { "@type": "Person", name: guide.author },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: picks.map(({ product, rank, pick }) => ({
        "@type": "ListItem",
        position: rank,
        name: `${fullName(product)} — ${pick.label}`,
        url: `${SITE_URL.replace(/\/$/, "")}/product/${product.slug}`,
      })),
    },
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
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[30rem] bg-[radial-gradient(55%_60%_at_20%_0%,var(--accent-soft),transparent_70%)]"
        />
        <Container className="pb-4 pt-6 sm:pt-8">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/guides", label: "Guides" },
              { href: `/guides#${category.slug}`, label: category.shortName },
              { label: guide.title },
            ]}
          />
          <div className="mt-8 grid gap-10 sm:mt-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
            <Reveal>
              <div className="flex flex-wrap items-center gap-2">
                <BudgetBadge budgetMax={guide.budgetMax} />
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                  <CategoryIcon icon={category.icon} className="size-3.5" />
                  {category.name}
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {guide.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{guide.excerpt}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <Initials name={guide.author} />
                <span>
                  <span className="block font-medium text-ink">{guide.author}</span>
                  <span className="block text-xs text-muted">
                    Updated <time dateTime={guide.updatedAt}>{dateLong(guide.updatedAt)}</time>
                  </span>
                </span>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {picks.length >= 2 && (
                  <ButtonLink href={compareUrl} variant="accent" size="lg">
                    <GitCompareArrows aria-hidden />
                    Compare all picks
                  </ButtonLink>
                )}
                <ButtonLink href="#picks" variant="glass" size="lg">
                  <ArrowDown aria-hidden />
                  Jump to picks
                </ButtonLink>
              </div>
            </Reveal>

            {picks.length > 0 && (
              <Reveal delay={0.08}>
                <nav aria-labelledby="glance-heading" className="glass rounded-panel p-2">
                  <p id="glance-heading" className="eyebrow px-4 pb-2 pt-3">
                    At a glance
                  </p>
                  <ol>
                    {picks.map(({ pick, product, rank, score, price }) => (
                      <li key={product.slug}>
                        <a
                          href={`#pick-${rank}`}
                          className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors duration-150 hover:bg-surface/70"
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-bg tnum">
                            {rank}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-accent">{pick.label}</span>
                            <span className="block truncate text-sm font-semibold text-ink">{fullName(product)}</span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <Price value={price} size="sm" />
                            <ScoreBadge score={score} size="sm" />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </Reveal>
            )}
          </div>
        </Container>
      </header>

      <Container className="mt-12 sm:mt-16">
        <div className="mx-auto max-w-4xl">
          {intro.length > 0 && <ArticleBody paragraphs={intro} />}

          <section id="picks" aria-labelledby="picks-heading" className="mt-16 scroll-mt-24">
            <h2 id="picks-heading" className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Our picks
            </h2>
            <p className="mt-2 text-muted">
              Ranked for this guide&apos;s brief. Prices are the lowest in-stock offer we last recorded.
            </p>
            <ol className="mt-10 space-y-12">
              {picks.map(({ pick, product, rank, score }) => (
                <li key={product.slug} id={`pick-${rank}`} className="scroll-mt-24">
                  <Reveal>
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent">
                      <Award className="size-3.5" aria-hidden />
                      <span className="sr-only">Pick {rank}: </span>
                      {pick.label}
                    </p>
                    <p className="mt-3 max-w-[68ch] text-[16.5px] leading-relaxed text-ink-2">{pick.reason}</p>
                    <ProductCard product={product} score={score} variant="row" rank={rank} className="mt-5" />
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>

          {rest.length > 0 && <ArticleBody paragraphs={rest} lead={false} className="mt-16" />}

          {picks.length >= 2 && (
            <Reveal className="mt-16">
              <div className="relative isolate overflow-hidden rounded-panel border border-line bg-surface p-6 shadow-sm sm:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]"
                />
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold tracking-tight text-ink">Still deciding?</p>
                    <p className="mt-1 max-w-md text-[15px] leading-relaxed text-muted">
                      Line up all {Math.min(picks.length, 5)} picks: specs side by side, differences highlighted and
                      price history on one chart.
                    </p>
                  </div>
                  <ButtonLink href={compareUrl} variant="ink" size="lg">
                    <GitCompareArrows aria-hidden />
                    Compare all picks
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
          )}

          <AdSlot id="guides-articles" className="mt-10" />

          <aside
            aria-label="Disclosure"
            className="mt-10 flex gap-3 rounded-card border border-line bg-surface-2/60 p-5 text-sm leading-relaxed text-muted"
          >
            <HandCoins className="mt-0.5 size-4 shrink-0 text-ink-2" aria-hidden />
            <p>
              <span className="font-medium text-ink-2">How we make money. </span>
              Some retailer links on product pages are affiliate links, so we may earn a commission at no extra cost
              to you. Commissions and advertising never influence which products we pick or how they score.{" "}
              <Link href="/disclosure" className="font-medium text-ink-2 underline underline-offset-2 hover:text-ink">
                Read our disclosure
              </Link>
              .
              {settings.demoMode && " This guide uses sample data with fictional brands."}
            </p>
          </aside>
        </div>
      </Container>

      {related.length > 0 && (
        <Container as="section" className="mt-24 sm:mt-28">
          <SectionHeader eyebrow="More advice" title="Related guides" action={{ href: "/guides", label: "All guides" }} />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g) => (
              <StaggerItem key={g.slug}>
                <GuideCard guide={g} />
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
export default function GuidePage({ params }: { params: Props["params"] }) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <GuidePageContent params={params} />
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
