import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/editorial/policy-page";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Tech Intelligence helps people discover, compare and understand technology before they buy.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { demoMode } = await getSettings();
  return (
    <PolicyPage
      crumb="About"
      eyebrow="About us"
      title="Technology, without the confusion."
      description="We help people discover new electronics, understand what the specifications really mean, compare up to five devices side by side and decide whether something is worth buying."
      notice={
        demoMode ? (
          <>
            <strong className="font-semibold text-ink">This is a sample-data build.</strong> The brands, products, prices,
            scores and articles on this site are illustrative placeholders used to demonstrate the platform. They will be
            replaced with researched, verified information before launch.
          </>
        ) : undefined
      }
      sections={[
        {
          title: "What we do",
          body: (
            <>
              <p>
                Tech Intelligence is a technology research and comparison platform for buyers in India. We cover
                smartphones, laptops, televisions, headphones, tablets and monitors, with more categories to come.
              </p>
              <p>
                Every product gets a full research page: specifications, benchmarks, expert reviews, owner feedback, pros and
                cons, a transparent platform score, current retailer prices and a price history built only from prices we
                have actually recorded.
              </p>
            </>
          ),
        },
        {
          title: "Our principles",
          body: (
            <ul>
              <li>
                <strong className="text-ink">Clarity over volume.</strong> Our goal is not the most products or the most
                animations. It is how easily you can understand a product and compare it with the alternatives.
              </li>
              <li>
                <strong className="text-ink">Evidence first.</strong> Every fact carries a source and the date it was checked.
              </li>
              <li>
                <strong className="text-ink">Open scoring.</strong> Weights are public and category-specific. See{" "}
                <Link href="/methodology">how we score</Link>.
              </li>
              <li>
                <strong className="text-ink">No pay-to-win.</strong> Advertising and affiliate links never influence scores,
                rankings or comparison results. See our <Link href="/disclosure">disclosure</Link>.
              </li>
              <li>
                <strong className="text-ink">Best for you, not one winner.</strong> Comparisons tell you which product suits
                which need.
              </li>
            </ul>
          ),
        },
        {
          title: "How we make money",
          body: (
            <p>
              We may earn a commission when you buy through some retailer links (always marked), and we may show clearly
              labelled sponsored placements. Neither affects what we publish. Full details are in our{" "}
              <Link href="/disclosure">affiliate and advertising disclosure</Link>.
            </p>
          ),
        },
        {
          title: "Get in touch",
          body: (
            <p>
              Found an error, want a product covered or have a partnership enquiry? <Link href="/contact">Contact us</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
