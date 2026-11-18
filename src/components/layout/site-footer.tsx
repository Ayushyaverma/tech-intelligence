import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CATEGORIES } from "@/lib/categories";
import { getSettings } from "@/lib/data";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { FOOTER_NAV, type NavLinkItem } from "./site";

const linkClass =
  "rounded-sm text-sm text-muted transition-colors duration-150 hover:text-ink focus-visible:text-ink";

function FooterColumn({ title, links }: { title: string; links: NavLinkItem[] }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkClass}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const { newsletterEnabled } = await getSettings();
  const categoryLinks = CATEGORIES.map((c) => ({ href: `/category/${c.slug}`, label: c.shortName }));

  return (
    <footer data-site-chrome className="mt-24 sm:mt-32">
      <Container>
        {newsletterEnabled && (
          <section
            aria-labelledby="newsletter-heading"
            className="relative isolate overflow-hidden rounded-hero border border-line bg-surface px-6 py-10 shadow-sm sm:px-12 sm:py-14 lg:px-16"
          >
            {/* soft gradient washes */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-32 -z-10 size-[28rem] rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 right-0 -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,var(--positive-soft),transparent)] opacity-70"
            />
            <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
              <div>
                <p className="eyebrow">The Sunday brief</p>
                <h2
                  id="newsletter-heading"
                  className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl lg:leading-[1.05]"
                >
                  The week in tech, minus the noise.
                </h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
                  Launches worth knowing, real recorded price drops and the comparisons readers asked for — in
                  one short email.
                </p>
              </div>
              <NewsletterForm />
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-16 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-8">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Independent technology research for Indian buyers. Transparent scores, recorded prices, no
              paid placements.
            </p>
          </div>
          <FooterColumn title="Categories" links={categoryLinks} />
          {FOOTER_NAV.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-8 text-xs leading-relaxed text-muted md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="max-w-2xl">
            Some retailer links are affiliate links: we may earn a commission at no extra cost to you.
            Commissions never influence scores or rankings.{" "}
            <Link href="/affiliate-disclosure" className="font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline">
              Affiliate disclosure
            </Link>
          </p>
          <p className="shrink-0 md:text-right">
            © 2026 Tech Intelligence
            <span className="mx-1.5 text-subtle" aria-hidden>
              ·
            </span>
            Prices in INR. Sample data build.
          </p>
        </div>
      </Container>
    </footer>
  );
}
