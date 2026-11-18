import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CircleDot, LineChart, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { fullName, toDeal } from "@/components/editorial/build";
import { DealsExplorer } from "@/components/editorial/deals-explorer";
import { PageHero } from "@/components/editorial/page-hero";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Price, PriceChange } from "@/components/ui/price";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { Sparkline } from "@/components/ui/sparkline";
import { getProducts, getSettings } from "@/lib/data";
import { formatINR, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Price drops",
  description:
    "Every recorded price drop over the last 30 days across phones, laptops, TVs, headphones, tablets and monitors — in INR, from real price checks.",
  alternates: { canonical: "/deals" },
};

/** Changes smaller than this are treated as noise, matching the "Flat" label on price pills. */
const MIN_MOVE = 0.5;

const POLICY = [
  {
    icon: CalendarCheck,
    title: "Recorded checks only",
    body: "Every point is a price we actually saw at a retailer on a given date. We never estimate, smooth or fill gaps.",
  },
  {
    icon: Store,
    title: "Lowest in-stock offer",
    body: "The current price is the cheapest in-stock offer from the retailers we track, including sale prices.",
  },
  {
    icon: LineChart,
    title: "30-day comparison",
    body: "Drops compare today's price with the price recorded 30 days before our latest check.",
  },
  {
    icon: ShieldCheck,
    title: "No paid placement",
    body: "Retailers can't pay to appear here. Affiliate commissions never change the order of this list.",
  },
];

export default async function DealsPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const all = products.map((p) => toDeal(p, settings));
  const drops = all.filter((d) => d.percent <= -MIN_MOVE).sort((a, b) => a.percent - b.percent);
  const rises = all
    .filter((d) => d.percent >= MIN_MOVE)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  const biggest = drops[0];
  const lowestCount = drops.filter((d) => d.lowestEver).length;
  const avgDrop = drops.length ? drops.reduce((s, d) => s + d.percent, 0) / drops.length : 0;

  const stats = [
    { label: "Recorded drops", value: String(drops.length), note: "over the last 30 days" },
    {
      label: "Biggest drop",
      value: biggest ? formatPercent(biggest.percent) : "—",
      note: biggest ? `${biggest.brand} ${biggest.name}` : "No drops yet",
    },
    { label: "Average drop", value: drops.length ? formatPercent(avgDrop) : "—", note: "across all categories" },
    { label: "At lowest recorded", value: String(lowestCount), note: "cheapest we've ever seen" },
  ];

  return (
    <>
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { label: "Price drops" }]}
        eyebrow="Deals"
        title="Price drops, recorded — not promised."
        description="Every product whose price fell over the last 30 days, ranked by how much. Only real retailer price checks count; there are no ‘was’ prices we didn’t see ourselves."
        aside={
          <dl className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="card p-4 sm:p-5">
                <dt className="text-xs font-medium text-muted">{s.label}</dt>
                <dd className="mt-2 text-2xl font-semibold tracking-tight text-ink tnum sm:text-3xl">{s.value}</dd>
                <dd className="mt-1 truncate text-xs text-subtle" title={s.note}>
                  {s.note}
                </dd>
              </div>
            ))}
          </dl>
        }
      />

      <Container>
        {drops.length === 0 ? (
          <EmptyState
            title="No recorded price drops right now"
            description="Prices have held steady over the last 30 days. We check retailers regularly — come back soon."
            action={{ href: "/category", label: "Browse categories" }}
          />
        ) : (
          <section aria-label="Price drops">
            <DealsExplorer deals={drops} />
          </section>
        )}

        {rises.length > 0 && (
          <section aria-labelledby="rises-heading" className="mt-24 sm:mt-28">
            <SectionHeader
              eyebrow="Heads-up"
              title={<span id="rises-heading">Recently increased</span>}
              description="Prices that went up over the same 30 days. If one of these is on your list, it may be worth waiting."
            />
            <Stagger as="ul" className="grid gap-3 md:grid-cols-2">
              {rises.map((d) => (
                <StaggerItem as="li" key={d.slug}>
                  <Link
                    href={d.href}
                    className="card card-hover group flex items-center gap-4 p-4 active:scale-[0.99]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-negative-soft text-negative">
                      <TrendingUp className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-muted">
                        {d.brand} · {d.categoryName}
                      </span>
                      <span className="block truncate text-sm font-semibold text-ink">{fullName(d)}</span>
                    </span>
                    <Sparkline points={d.points} width={72} height={26} className="hidden shrink-0 sm:block" />
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Price value={d.price} size="sm" />
                      <span className="flex items-center gap-1.5">
                        <span className="text-[11px] text-subtle">
                          <span className="sr-only">was </span>
                          {formatINR(d.oldPrice)}
                        </span>
                        <PriceChange percent={d.percent} size="sm" />
                      </span>
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        )}

        <section aria-labelledby="policy-heading" className="mt-24 sm:mt-28">
          <Reveal className="relative isolate overflow-hidden rounded-hero border border-line bg-surface p-6 shadow-sm sm:p-10 lg:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-32 -z-10 size-[26rem] rounded-full bg-[radial-gradient(closest-side,var(--positive-soft),transparent)]"
            />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
              <div>
                <p className="eyebrow flex items-center gap-1.5">
                  <CircleDot className="size-3.5 text-positive" aria-hidden />
                  How we record prices
                </p>
                <h2 id="policy-heading" className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  Honest numbers, or none at all.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Price graphs on this site only join dots we recorded. When a product is out of stock everywhere, we
                  show the last recorded price and say so.{" "}
                  <Link href="/methodology#prices" className="font-medium text-ink-2 underline underline-offset-2 hover:text-ink">
                    Price tracking policy
                  </Link>
                </p>
                {settings.demoMode && (
                  <p className="mt-4 text-xs leading-relaxed text-subtle">
                    This build uses sample products and prices with fictional brands. Retailer links are placeholders.
                  </p>
                )}
              </div>
              <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {POLICY.map(({ icon: Icon, title, body }) => (
                  <li key={title}>
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-ink-2 ring-1 ring-inset ring-line">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <p className="mt-3 font-medium text-ink">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      </Container>
    </>
  );
}
