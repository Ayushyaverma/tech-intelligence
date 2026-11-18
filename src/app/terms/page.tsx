import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/editorial/policy-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using Tech Intelligence.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      crumb="Terms"
      eyebrow="Legal"
      title="Terms of use"
      description="The ground rules for using this site."
      meta="Last updated 17 November 2026"
      notice={
        <>
          <strong className="font-semibold text-ink">Template notice:</strong> these terms are a plain-language starting point
          and must be reviewed by a qualified professional before launch.
        </>
      }
      sections={[
        {
          title: "Information, not advice",
          body: (
            <p>
              We research carefully, but specifications, prices and availability change. Always confirm the price and details
              with the retailer before you buy. Scores are our assessment using a published{" "}
              <Link href="/methodology">methodology</Link>, not a guarantee of performance.
            </p>
          ),
        },
        {
          title: "Prices",
          body: (
            <p>
              Prices are shown in INR with the time they were last checked. Retailers may change prices at any time; the
              retailer’s price at checkout applies.
            </p>
          ),
        },
        {
          title: "Using our content",
          body: (
            <p>
              You are welcome to share links to our pages. Please do not copy our reviews, scores or data in bulk without
              permission.
            </p>
          ),
        },
        {
          title: "Third-party sites",
          body: <p>Links to retailers and reviewers lead to sites we do not control. Their terms and policies apply there.</p>,
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about these terms? <Link href="/contact">Contact us</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
