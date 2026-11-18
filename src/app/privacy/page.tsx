import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/editorial/policy-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What information Tech Intelligence collects and how it is used.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      crumb="Privacy"
      eyebrow="Legal"
      title="Privacy policy"
      description="In plain language: what we collect, why, and the choices you have."
      meta="Last updated 17 November 2026"
      notice={
        <>
          <strong className="font-semibold text-ink">Template notice:</strong> this policy is a plain-language starting point
          and must be reviewed by a qualified professional (including against India’s Digital Personal Data Protection Act,
          2023) before launch.
        </>
      }
      sections={[
        {
          title: "Information you give us",
          body: (
            <ul>
              <li>
                <strong className="text-ink">Newsletter:</strong> your email address, used only to send the newsletter.
              </li>
              <li>
                <strong className="text-ink">Contact form:</strong> your name, email and message, used to reply to you.
              </li>
            </ul>
          ),
        },
        {
          title: "Information stored on your device",
          body: (
            <>
              <p>
                We store a few preferences in your browser’s local storage: your light or dark theme choice and the products
                you have selected to compare. This never leaves your device, and you can clear it at any time from your
                browser settings.
              </p>
              <p>We do not use advertising trackers.</p>
            </>
          ),
        },
        {
          title: "Retailer links",
          body: (
            <p>
              When you follow a link to a retailer, you leave our site and that retailer’s privacy policy applies. Some links
              are affiliate links; see our <Link href="/disclosure">disclosure</Link>.
            </p>
          ),
        },
        {
          title: "Your choices",
          body: (
            <ul>
              <li>Unsubscribe from the newsletter at any time.</li>
              <li>
                Ask us to access, correct or delete the information we hold about you through the{" "}
                <Link href="/contact">contact page</Link>.
              </li>
            </ul>
          ),
        },
        {
          title: "Changes",
          body: <p>If we change this policy we will update the date at the top of this page.</p>,
        },
      ]}
    />
  );
}
