import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { deviceVariant } from "@/components/device-art";
import { SITE_NAME, SITE_URL } from "@/components/layout/site";
import { Alternatives } from "@/components/product/alternatives";
import { Benchmarks } from "@/components/product/benchmarks";
import { Highlights } from "@/components/product/highlights";
import { PriceHistorySection } from "@/components/product/price-history-section";
import { ProductHero } from "@/components/product/product-hero";
import { ProductSection } from "@/components/product/product-section";
import { ProsCons } from "@/components/product/pros-cons";
import { ExpertReviews, UserExperiences } from "@/components/product/reviews";
import { ScoreBreakdown } from "@/components/product/score-breakdown";
import { SectionNav, type NavSection } from "@/components/product/section-nav";
import { Sources } from "@/components/product/sources";
import { SpecSheet } from "@/components/product/spec-sheet";
import { Verdict } from "@/components/product/verdict";
import { WhereToBuy } from "@/components/product/where-to-buy";
import { AdSlot } from "@/components/ui/ad-slot";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { requireCategory } from "@/lib/categories";
import { getAlternatives, getProduct, getProducts, getProductsByCategory, getSettings } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { bestOffer, computeScore, currentPrice, effectiveCriteria, lastChecked } from "@/lib/product-utils";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  const settings = await getSettings();
  const fullName = `${product.brand} ${product.name}`;
  const score = computeScore(product, settings);
  const description = `${fullName}: platform score ${score}/100, ${formatINR(currentPrice(product))} best price, full specifications, price history, reviews and alternatives.`;
  return {
    title: `${fullName} — specs, score & price history`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: `${fullName} · ${SITE_NAME}`, description, url: `/product/${product.slug}`, type: "website" },
  };
}

const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "price-history", label: "Price history" },
  { id: "scores", label: "Score" },
  { id: "specs", label: "Specs" },
  { id: "performance", label: "Performance" },
  { id: "reviews", label: "Reviews" },
  { id: "pros-cons", label: "Pros & cons" },
  { id: "where-to-buy", label: "Where to buy" },
  { id: "alternatives", label: "Alternatives" },
];

async function ProductPageContent({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, peers, alternatives] = await Promise.all([
    getSettings(),
    getProductsByCategory(product.category),
    getAlternatives(product),
  ]);

  const category = requireCategory(product.category);
  const fullName = `${product.brand} ${product.name}`;
  const score = computeScore(product, settings);
  const criteria = effectiveCriteria(category, settings);
  const ranked = [...peers].sort((a, b) => computeScore(b, settings) - computeScore(a, settings));
  const rank = Math.max(1, ranked.findIndex((p) => p.id === product.id) + 1);
  const price = currentPrice(product);
  const offer = bestOffer(product);
  const adjusted = Boolean(settings.weightOverrides?.[category.slug]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullName,
    brand: { "@type": "Brand", name: product.brand },
    category: category.name,
    description: product.summary,
    url: `${SITE_URL}/product/${product.slug}`,
    ...(product.userFeedback && product.userFeedback.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.userFeedback.average,
            reviewCount: product.userFeedback.count,
            bestRating: 5,
          },
        }
      : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: price,
      highPrice: Math.max(...product.offers.map((o) => o.price), price),
      offerCount: product.offers.length,
      availability: offer?.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="pt-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: `/category/${category.slug}`, label: category.name },
            { label: fullName },
          ]}
        />
        <div id="overview" className="scroll-mt-36 pt-8 sm:pt-10">
          <ProductHero product={product} category={category} score={score} rank={rank} rankOf={ranked.length} fullName={fullName} />
        </div>
      </Container>

      <div className="mt-12 sm:mt-16">
        <SectionNav
          sections={SECTIONS}
          buyId="where-to-buy"
          product={{
            name: fullName,
            priceText: formatINR(price),
            category: product.category,
            art: product.art,
            variant: deviceVariant(product),
          }}
        />
      </div>

      <Container>
        <div className="divide-y divide-line">
          <ProductSection
            id="price-history"
            eyebrow="Price tracking"
            title="Price history"
            description="Every point on this graph is a recorded retailer price. We never interpolate or estimate missing data."
          >
            <PriceHistorySection product={product} fullName={fullName} />
          </ProductSection>

          <ProductSection
            id="scores"
            eyebrow="Platform score"
            title="How the score is built"
            description={`${category.name} are scored on ${criteria.length} weighted criteria. The weights are public and identical for every ${category.singular}.`}
            action={{ href: "/methodology", label: "Methodology" }}
          >
            <ScoreBreakdown product={product} criteria={criteria} score={score} categoryName={category.name} adjusted={adjusted} />
            <div className="mt-10">
              <Verdict product={product} />
            </div>
          </ProductSection>

          <ProductSection
            id="specs"
            eyebrow="Specifications"
            title="Technical specifications"
            description={`The full ${category.singular} spec sheet, grouped the same way for every ${category.singular} so you can compare like with like.`}
          >
            <SpecSheet product={product} category={category} />
          </ProductSection>

          {/* Ad slot 03 — below core specifications; renders nothing while disabled */}
          <AdSlot id="product-below-specs" className="my-10" />

          <ProductSection
            id="performance"
            eyebrow="Performance"
            title="Benchmarks & key areas"
            description={`Measured results compared with the average of other ${category.name.toLowerCase()} we track.`}
          >
            <Benchmarks product={product} peers={peers} noun={category.singular} />
            <div className="mt-12">
              <Highlights product={product} category={category} />
            </div>
          </ProductSection>

          <ProductSection
            id="reviews"
            eyebrow="Reviews"
            title="What reviewers and owners say"
            description="Expert reviews are summarised and linked to the original source. Owner feedback is paraphrased from verified reports."
          >
            <ExpertReviews reviews={product.reviews} />
            <div className="mt-12">
              <UserExperiences feedback={product.userFeedback} />
            </div>
          </ProductSection>

          <ProductSection id="pros-cons" eyebrow="Verdict" title="Pros & cons">
            <ProsCons product={product} category={category} />
          </ProductSection>

          <ProductSection
            id="where-to-buy"
            eyebrow="Where to buy"
            title="Retailer prices"
            description="Sorted from lowest price. Each price shows when it was last checked."
          >
            <WhereToBuy offers={product.offers} productName={fullName} demo={settings.demoMode} />
          </ProductSection>

          {alternatives.length > 0 && (
            <ProductSection
              id="alternatives"
              eyebrow="Alternatives"
              title={`Similar ${category.name.toLowerCase()}`}
              description="Products in the same category closest to this one in price."
              action={{ href: `/category/${category.slug}`, label: `All ${category.shortName.toLowerCase()}` }}
            >
              <Alternatives
                product={product}
                alternatives={alternatives.map((p) => ({ product: p, score: computeScore(p, settings) }))}
              />
            </ProductSection>
          )}

          <ProductSection id="sources" eyebrow="Transparency" title="Sources & updates">
            <Sources product={product} lastCheckedAt={lastChecked(product)} />
          </ProductSection>
        </div>
      </Container>
    </>
  );
}

/**
 * The params-dependent content sits inside <Suspense> so Next can also prerender
 * this route's generic fallback shell (used for slugs added after the build and
 * when pages regenerate after an admin edit). Known slugs still prerender fully.
 */
export default function ProductPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <ProductPageContent params={params} />
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
