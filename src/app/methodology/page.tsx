import type { Metadata } from "next";
import {
  BadgeCheck,
  BookOpenCheck,
  ClipboardList,
  Database,
  FileSearch,
  FlaskConical,
  Gauge,
  LineChart,
  MessageSquareQuote,
  PenLine,
  RefreshCcw,
  Scale,
  Send,
  Store,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/editorial/page-hero";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { CATEGORIES } from "@/lib/categories";
import { getSettings } from "@/lib/data";
import { effectiveCriteria } from "@/lib/product-utils";

export const metadata: Metadata = {
  title: "How we score",
  description:
    "Our scoring methodology: category-specific criteria and public weights, score types, the research and publishing pipeline, and how prices are tracked.",
  alternates: { canonical: "/methodology" },
};

const SCORE_TYPES = [
  {
    icon: PenLine,
    title: "Editorial score",
    body: "Our editors' assessment against each criterion, based on hands-on testing notes and the sources listed on the product page.",
  },
  {
    icon: Users,
    title: "Multi-source aggregate",
    body: "A weighted combination of ratings from independent reviewers we trust, normalised to 0–100 per criterion. The sources are always listed.",
  },
  {
    icon: FlaskConical,
    title: "Benchmark-derived",
    body: "Criteria scored from measured lab and benchmark results (performance, battery, brightness), scaled against the rest of the category.",
  },
];

const PIPELINE = [
  { icon: FileSearch, title: "New product identified", body: "A launch or a product readers ask about enters the queue with its category." },
  { icon: ClipboardList, title: "Collect official specifications", body: "From the manufacturer, using the category's spec template." },
  { icon: MessageSquareQuote, title: "Collect expert reviews", body: "Independent reviews are read, summarised and linked — never copied." },
  { icon: Gauge, title: "Collect benchmarks & testing", body: "Lab results and benchmark scores, with the method noted." },
  { icon: Store, title: "Collect retailer prices", body: "Prices from major Indian retailers, each with date, time and availability." },
  { icon: Users, title: "Collect user feedback", body: "Recurring themes from verified owner reports are paraphrased." },
  { icon: Database, title: "Store source URLs & dates", body: "Every fact is tied to a source and the date it was checked." },
  { icon: Scale, title: "Cross-check information", body: "Conflicting or missing data is flagged and researched further before moving on." },
  { icon: BadgeCheck, title: "Verify & calculate the score", body: "Only verified data is scored, using the category weights below." },
  { icon: BookOpenCheck, title: "Editorial quality check", body: "Summary, pros and cons and comparison data are reviewed before approval." },
  { icon: Send, title: "Publish", body: "The product joins its category, comparisons and search." },
  { icon: RefreshCcw, title: "Track changes", body: "Prices and specs are re-checked; outdated information goes back through the pipeline." },
];

export default async function MethodologyPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { label: "Methodology" }]}
        eyebrow="Methodology"
        title="How we score technology."
        description="Every platform score is out of 100 and built from documented criteria with public weights. Each category has its own formula, so a laptop is never judged like a phone."
      />

      <Container className="space-y-24 pb-24">
        {/* weights per category */}
        <section aria-labelledby="weights">
          <SectionHeader
            eyebrow="Criteria & weights"
            title={<span id="weights">What counts, and how much</span>}
            description="Each criterion is scored 0–100. The platform score is the weighted average. These are the weights in use today."
          />
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {CATEGORIES.map((category) => {
              const criteria = effectiveCriteria(category, settings);
              return (
                <StaggerItem key={category.slug} className="h-full">
                  <article className="card h-full p-6">
                    <header className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                        <CategoryIcon icon={category.icon} className="size-5" />
                      </span>
                      <h3 className="text-lg font-semibold tracking-tight text-ink">{category.name}</h3>
                    </header>
                    <ul className="mt-6 space-y-4">
                      {criteria.map((c) => (
                        <li key={c.key}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-medium text-ink" title={c.description}>
                              {c.label}
                            </span>
                            <span className="font-semibold text-ink tnum">{c.weight}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, c.weight * 2.5)}%` }} />
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.description}</p>
                        </li>
                      ))}
                    </ul>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* score types */}
        <section aria-labelledby="types">
          <SectionHeader
            eyebrow="Score types"
            title={<span id="types">Where a score comes from</span>}
            description="Every product page labels its score type. We never mix the three without explaining the calculation."
          />
          <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {SCORE_TYPES.map((t) => (
              <StaggerItem key={t.title} className="h-full">
                <div className="card h-full p-6">
                  <t.icon className="size-6 text-accent" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* pipeline */}
        <section aria-labelledby="pipeline" className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              eyebrow="Research pipeline"
              title={<span id="pipeline">From launch to published page</span>}
              description="Every product goes through the same twelve steps before it is scored and published — and back through them when something changes."
            />
          </Reveal>
          <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[1.375rem] before:top-6 before:w-px before:bg-line">
            {PIPELINE.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={Math.min(i, 6) * 0.03} className="relative flex gap-4">
                  <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-accent shadow-xs">
                    <step.icon className="size-[18px]" aria-hidden />
                  </span>
                  <div className="card flex-1 px-5 py-4">
                    <p className="text-xs font-medium text-subtle tnum">Step {String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-0.5 font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* prices + corrections */}
        <section aria-label="Prices and corrections" className="grid gap-5 md:grid-cols-2">
          <Reveal className="card h-full p-8">
            <LineChart className="size-6 text-accent" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">How prices are tracked</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
              <li>Prices are shown in Indian rupees (INR).</li>
              <li>Each record stores the product, retailer, price, date and time checked, availability and the retailer URL.</li>
              <li>The current price is the lowest in-stock offer we have verified.</li>
              <li>Price-history graphs only plot prices we actually recorded — gaps are never filled in.</li>
              <li>Affiliate links are marked, and never influence scores or rankings.</li>
            </ul>
          </Reveal>
          <Reveal delay={0.05} className="card h-full p-8">
            <RefreshCcw className="size-6 text-accent" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Corrections & updates</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
              <li>Every product page shows when it was last updated and lists its sources.</li>
              <li>When a manufacturer changes a spec or a software update changes performance, the product is re-verified and re-scored.</li>
              <li>If weights change, all scores in that category are recalculated together so comparisons stay fair.</li>
              <li>Spotted a mistake? Tell us through the contact page and we will correct it.</li>
            </ul>
          </Reveal>
        </section>
      </Container>
    </>
  );
}
