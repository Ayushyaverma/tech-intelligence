import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { productMap, toArticleCard } from "@/components/editorial/build";
import { NewsCard } from "@/components/editorial/news-card";
import { NewsExplorer } from "@/components/editorial/news-explorer";
import { NewsletterCta } from "@/components/editorial/newsletter-cta";
import { PageHero } from "@/components/editorial/page-hero";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { getNews, getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "News & analysis",
  description:
    "Technology launches, recorded price moves and industry analysis for Indian buyers — verified before we publish.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const [news, products] = await Promise.all([getNews(), getProducts()]);
  const bySlug = productMap(products);
  const cards = news.map((a) => toArticleCard(a, bySlug));

  // Lead = newest featured story; the next two featured (or newest) stories sit beside the newsletter card.
  const featured = cards.filter((c) => c.featured);
  const lead = featured[0] ?? cards[0];
  const secondary = [...featured.slice(1), ...cards.filter((c) => !c.featured)]
    .filter((c) => c.slug !== lead?.slug)
    .slice(0, 2);
  const pinned = [lead, ...secondary].filter(Boolean).map((c) => c.slug);

  return (
    <>
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { label: "News" }]}
        eyebrow="Newsroom"
        title="News & analysis"
        description="Launches, recorded price moves and the industry shifts that change what you should buy — checked against sources before we publish."
      >
        {lead && (
          <p className="text-sm text-muted">
            {cards.length} stories · Latest{" "}
            <time dateTime={cards[0].publishedAt} className="font-medium text-ink-2">
              {cards[0].dateLabel}
            </time>
          </p>
        )}
      </PageHero>

      <Container>
        {!lead ? (
          <EmptyState
            icon={Newspaper}
            title="No stories published yet"
            description="Verified news and analysis will appear here as soon as it's published."
            action={{ href: "/", label: "Back to home" }}
          />
        ) : (
          <>
            <Reveal>
              <NewsCard article={lead} variant="lead" headingLevel="h2" />
            </Reveal>

            <Stagger className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {secondary.map((a) => (
                <StaggerItem key={a.slug}>
                  <NewsCard article={a} headingLevel="h2" />
                </StaggerItem>
              ))}
              <StaggerItem className="md:col-span-2 lg:col-span-1">
                <NewsletterCta className="h-full" />
              </StaggerItem>
            </Stagger>

            <section aria-labelledby="latest-heading" className="mt-24 sm:mt-28">
              <SectionHeader
                eyebrow="Latest"
                title={<span id="latest-heading">Every story, newest first</span>}
                description="Filter by launches, price watch, industry analysis or long-term reviews."
              />
              <NewsExplorer articles={cards} pinned={pinned} />
            </section>
          </>
        )}
      </Container>
    </>
  );
}
