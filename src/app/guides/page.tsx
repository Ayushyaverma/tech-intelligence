import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ListOrdered, RefreshCcw, ShieldCheck } from "lucide-react";
import { productMap, toGuideCard } from "@/components/editorial/build";
import { GuideCard } from "@/components/editorial/guide-card";
import { PageHero } from "@/components/editorial/page-hero";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { CATEGORIES } from "@/lib/categories";
import { getGuides, getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Buying guides",
  description:
    "Ranked buying guides for phones, laptops, TVs, headphones, tablets and monitors — by budget and by use, with recorded prices.",
  alternates: { canonical: "/guides" },
};

const PROMISES = [
  { icon: ListOrdered, title: "Ranked by platform score", body: "Every pick starts from our weighted, category-specific score." },
  { icon: ShieldCheck, title: "Checked for deal-breakers", body: "We look for weaknesses that matter day to day, not just spec sheets." },
  { icon: RefreshCcw, title: "Prices re-checked", body: "Budgets are tested against the latest recorded retailer prices." },
];

export default async function GuidesPage() {
  const [guides, products] = await Promise.all([getGuides(), getProducts()]);
  const bySlug = productMap(products);
  const groups = CATEGORIES.map((c) => ({
    category: c,
    guides: guides.filter((g) => g.category === c.slug).map((g) => toGuideCard(g, bySlug)),
  })).filter((g) => g.guides.length > 0);

  return (
    <>
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { label: "Buying guides" }]}
        eyebrow="Buying guides"
        title="Buy the right thing, the first time."
        description="Short, ranked guides by budget and by use. Each one names a best overall pick and explains exactly who the others are for."
        aside={
          <div className="card p-6 sm:p-7">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BookOpenCheck className="size-4 text-accent" aria-hidden />
              How our guides work
            </p>
            <ul className="mt-5 space-y-4">
              {PROMISES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{title}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/methodology"
              className="group mt-6 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-strong"
            >
              Read the methodology
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        }
      >
        {groups.length > 1 && (
          <nav aria-label="Jump to a category">
            <ul className="flex flex-wrap gap-2">
              {groups.map(({ category, guides: list }) => (
                <li key={category.slug}>
                  <a
                    href={`#${category.slug}`}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-surface px-3.5 text-[13px] font-medium text-ink-2 shadow-xs ring-1 ring-inset ring-line transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.98]"
                  >
                    <CategoryIcon icon={category.icon} className="size-3.5" />
                    {category.shortName}
                    <span className="text-subtle tnum">{list.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </PageHero>

      <Container className="space-y-20 sm:space-y-24">
        {groups.length === 0 && (
          <EmptyState
            icon={BookOpenCheck}
            title="No guides published yet"
            description="Our first buying guides are in editing. In the meantime, compare products side by side."
            action={{ href: "/compare", label: "Open compare" }}
          />
        )}
        {groups.map(({ category, guides: list }) => (
          <section key={category.slug} id={category.slug} aria-labelledby={`${category.slug}-heading`} className="scroll-mt-28">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-surface text-accent shadow-sm ring-1 ring-line">
                  <CategoryIcon icon={category.icon} className="size-5" />
                </span>
                <div>
                  <h2 id={`${category.slug}-heading`} className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {category.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {list.length} {list.length === 1 ? "guide" : "guides"} · {category.tagline}
                  </p>
                </div>
              </div>
              <Link
                href={`/category/${category.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-strong"
              >
                All {category.shortName}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((g) => (
                <StaggerItem key={g.slug}>
                  <GuideCard guide={g} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ))}
      </Container>
    </>
  );
}
