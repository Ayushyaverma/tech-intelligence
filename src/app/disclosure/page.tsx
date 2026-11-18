import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/editorial/policy-page";

export const metadata: Metadata = {
  title: "Affiliate & advertising disclosure",
  description: "How Tech Intelligence earns money, and why it never affects scores, rankings or comparisons.",
  alternates: { canonical: "/disclosure" },
};

export default function DisclosurePage() {
  return (
    <PolicyPage
      crumb="Disclosure"
      eyebrow="Transparency"
      title="Affiliate & advertising disclosure"
      description="How we earn money, and the rules that keep it separate from our research."
      meta="Last updated 17 November 2026"
      sections={[
        {
          title: "Affiliate links",
          body: (
            <>
              <p>
                Some “Go to store” links on product pages are affiliate links. If you buy through one, the retailer may pay
                us a small commission at no extra cost to you. Affiliate links are labelled “Affiliate” and marked as
                sponsored links for search engines.
              </p>
              <p>We list every retailer we track, whether or not it pays a commission, and always sort offers by price.</p>
            </>
          ),
        },
        {
          title: "Advertising",
          body: (
            <>
              <p>
                We reserve a small number of advertising placements: on the homepage between news sections, between
                category listings, below product specifications, within guides and articles, and below comparison results.
              </p>
              <p>Every advertisement is labelled “Sponsored”. Placements stay switched off until an advertising partner is in place.</p>
            </>
          ),
        },
        {
          title: "What money never changes",
          body: (
            <ul>
              <li>
                Platform scores, which follow our public <Link href="/methodology">methodology</Link>.
              </li>
              <li>The order of products in listings, comparisons and “best for” verdicts.</li>
              <li>Which products we cover, review or include in buying guides.</li>
              <li>The prices we show, which are always the lowest verified in-stock offer.</li>
            </ul>
          ),
        },
        {
          title: "Sponsored content",
          body: (
            <p>
              If we ever publish sponsored articles or brand partnerships, they will be clearly identified at the top of the
              page and kept separate from our reviews and scores.
            </p>
          ),
        },
        {
          title: "Questions",
          body: (
            <p>
              If something looks wrong, please <Link href="/contact">tell us</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
