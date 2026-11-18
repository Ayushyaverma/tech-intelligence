import type { Metadata } from "next";
import { BuyingGuides } from "@/components/home/buying-guides";
import { CategoryTiles } from "@/components/home/category-tiles";
import { FeaturedTech } from "@/components/home/featured-tech";
import { Hero } from "@/components/home/hero";
import { loadHomeData } from "@/components/home/home-data";
import { LatestReviews } from "@/components/home/latest-reviews";
import { PriceUpdates } from "@/components/home/price-updates";
import { TrendingComparisons } from "@/components/home/trending-comparisons";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/components/layout/site";
import { AdSlot } from "@/components/ui/ad-slot";
import { Container } from "@/components/ui/container";

const TITLE = `${SITE_NAME} — Technology, without the confusion`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: SITE_DESCRIPTION, url: "/" },
};

/** WebSite structured data with a sitelinks search box pointing at /search. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

/**
 * Homepage. Section order follows REQUIREMENTS R1 (the nav, newsletter and
 * footer come from the root layout).
 */
export default async function HomePage() {
  const data = await loadHomeData();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      {/* 2 · latest launches + news, price watch, stats */}
      <Hero
        launch={data.launch}
        drops={data.heroDrops}
        headlines={data.headlines}
        stats={data.stats}
        updatedAt={data.updatedAt}
      />
      {/* 3 */}
      <PriceUpdates items={data.dropItems} />
      {/* 4 */}
      <FeaturedTech stories={data.featured} />
      {/* 5 */}
      <CategoryTiles tiles={data.categoryTiles} />
      {/* 6 */}
      <TrendingComparisons items={data.comparisonCards} />
      {/* 7 */}
      <BuyingGuides items={data.guideCards} />
      {/* 8 · reserved advertising slot; renders nothing while disabled in Admin → Settings */}
      <Container>
        <AdSlot id="home-between-news" />
      </Container>
      {/* 9 */}
      <LatestReviews items={data.reviews} />
    </>
  );
}
