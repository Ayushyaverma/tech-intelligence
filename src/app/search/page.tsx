import type { Metadata } from "next";
import { Suspense } from "react";
import { deviceVariant } from "@/components/device-art";
import { dateMedium } from "@/components/editorial/dates";
import { NEWS_KINDS } from "@/components/editorial/news-kind";
import { PageHero } from "@/components/editorial/page-hero";
import { SearchResults, type SearchDoc } from "@/components/editorial/search-results";
import { Container } from "@/components/ui/container";
import { CATEGORIES, requireCategory } from "@/lib/categories";
import { getGuides, getNews, getProducts, getSettings } from "@/lib/data";
import { computeScore, currentPrice, productHref } from "@/lib/product-utils";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every product, review, news story and buying guide.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default async function SearchPage() {
  const [products, news, guides, settings] = await Promise.all([getProducts(), getNews(), getGuides(), getSettings()]);

  // Slim, serialisable index — the query itself is read client-side (useSearchParams).
  const docs: SearchDoc[] = [
    ...products.map((p): SearchDoc => {
      const category = requireCategory(p.category);
      const specText = Object.values(p.specs)
        .filter((v) => typeof v !== "boolean")
        .join(" ");
      return {
        type: "product",
        href: productHref(p),
        title: `${p.brand} ${p.name}`,
        subtitle: `${p.brand} · ${category.shortName}`,
        text: [p.brand, p.name, p.tagline, category.name, category.shortName, p.tier, specText].join(" ").toLowerCase(),
        category: p.category,
        score: computeScore(p, settings),
        price: currentPrice(p),
        art: { primary: p.art.primary, accent: p.art.accent },
        variant: deviceVariant(p),
        popularity: p.popularity,
      };
    }),
    ...news.map(
      (a): SearchDoc => ({
        type: "article",
        href: `/news/${a.slug}`,
        title: a.title,
        subtitle: `${NEWS_KINDS[a.kind].label} · ${dateMedium(a.publishedAt)} · ${a.readMinutes} min read`,
        text: [a.title, a.excerpt, a.tags.join(" "), a.kind].join(" ").toLowerCase(),
        popularity: a.featured ? 60 : 40,
      }),
    ),
    ...guides.map(
      (g): SearchDoc => ({
        type: "guide",
        href: `/guides/${g.slug}`,
        title: g.title,
        subtitle: `Buying guide · ${requireCategory(g.category).name} · ${g.picks.length} picks`,
        text: [g.title, g.excerpt, requireCategory(g.category).name].join(" ").toLowerCase(),
        popularity: 50,
      }),
    ),
  ];

  const brands = [...new Set(products.map((p) => p.brand))].slice(0, 3);
  const suggestions = ["OLED", "noise cancelling", "16 GB", "budget", ...brands];

  return (
    <>
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { label: "Search" }]}
        eyebrow="Search"
        title="Find any device, story or guide."
        description="Search by product, brand, category or specification."
      />
      <Container className="pb-24">
        <Suspense fallback={<div className="skeleton h-14 max-w-2xl rounded-full" />}>
          <SearchResults
            docs={docs}
            categories={CATEGORIES.map(({ slug, name, icon }) => ({ slug, name, icon }))}
            suggestions={suggestions}
          />
        </Suspense>
      </Container>
    </>
  );
}
