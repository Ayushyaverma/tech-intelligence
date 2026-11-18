import type { Metadata } from "next";
import { Suspense } from "react";
import { buildCompareData } from "@/components/compare-page/build-data";
import { CompareView } from "@/components/compare-page/compare-view";
import { AdSlot } from "@/components/ui/ad-slot";
import { Container } from "@/components/ui/container";
import { getProducts, getSettings, getTrendingComparisons } from "@/lib/data";

export const metadata: Metadata = {
  title: "Compare products side by side",
  description: "Compare two to five phones, laptops, TVs, headphones, tablets or monitors: scores, specs, prices and price history.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const [products, settings, trending] = await Promise.all([getProducts(), getSettings(), getTrendingComparisons()]);
  const data = buildCompareData(products, settings, trending);

  return (
    <Container className="pb-28 pt-8 sm:pt-12">
      {/* CompareView reads ?ids= with useSearchParams, which needs a Suspense boundary */}
      <Suspense fallback={<CompareFallback />}>
        <CompareView data={data} adSlot={<AdSlot id="compare-below-results" />} />
      </Suspense>
    </Container>
  );
}

function CompareFallback() {
  return (
    <div aria-busy="true" aria-label="Loading comparison" className="space-y-6">
      <div className="skeleton h-10 w-72" />
      <div className="skeleton h-28 rounded-[22px]" />
      <div className="skeleton h-64 rounded-card" />
      <div className="skeleton h-96 rounded-card" />
    </div>
  );
}
