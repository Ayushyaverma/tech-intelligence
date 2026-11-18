import Link from "next/link";
import type { CSSProperties } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { CATEGORIES } from "@/lib/categories";
import type { NewsArticle, Product } from "@/lib/types";
import { HeroSearch } from "./hero-search";
import { LaunchCard, NewsCard, PriceWatchCard, type PriceDropRow } from "./hero-bento";
import { categoryHref, longDate } from "./home-utils";
import { StatsStrip, type HomeStats } from "./stats-strip";

interface HeroProps {
  launch?: { article: NewsArticle; product?: Product };
  drops: PriceDropRow[];
  headlines: NewsArticle[];
  stats: HomeStats;
  /** ISO datetime of the newest published story ("Updated …") */
  updatedAt?: string;
}

/**
 * Entrance animation for above-the-fold content. Pure CSS (globals.css
 * `animate-fade-up`) so it runs before hydration and doesn't delay the
 * largest paint; the global reduced-motion rule turns it off.
 */
const enter = (delayMs: number): CSSProperties => ({ animationDelay: `${delayMs}ms` });

export function Hero({ launch, drops, headlines, stats, updatedAt }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroBackdrop />

      <Container className="pb-6 pt-12 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-ink-2 shadow-xs backdrop-blur-md"
            style={enter(0)}
          >
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inset-0 rounded-full bg-positive opacity-30 blur-[3px]" />
              <span className="relative size-2 rounded-full bg-positive" />
            </span>
            Your daily technology brief
            {updatedAt && (
              <>
                <span className="text-subtle" aria-hidden>
                  ·
                </span>
                <span className="text-muted">
                  Updated <time dateTime={updatedAt}>{longDate(updatedAt)}</time>
                </span>
              </>
            )}
          </p>

          <h1
            id="hero-title"
            className="animate-fade-up mt-6 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl"
            style={enter(60)}
          >
            Technology, <span className="whitespace-nowrap">without the</span>{" "}
            <span className="bg-linear-to-br from-accent to-[color-mix(in_oklab,var(--accent)_55%,var(--ink))] bg-clip-text text-transparent">
              confusion.
            </span>
          </h1>

          <p className="animate-fade-up mt-5 text-lg text-muted sm:text-xl" style={enter(120)}>
            Discover. Compare. Understand. <span className="font-medium text-ink">Buy smarter.</span>
          </p>

          <div className="animate-fade-up mx-auto mt-8 max-w-xl" style={enter(180)}>
            <HeroSearch />
          </div>

          <nav aria-label="Browse by category" className="animate-fade-up mt-5" style={enter(240)}>
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
              {CATEGORIES.map((c) => (
                <li key={c.slug} className="shrink-0">
                  <Link
                    href={categoryHref(c.slug)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3.5 text-[13px] font-medium text-ink-2 shadow-xs backdrop-blur-sm transition-[background-color,color,border-color,transform] duration-150 hover:border-line-strong hover:bg-surface hover:text-ink active:scale-[0.98]"
                  >
                    <CategoryIcon icon={c.icon} className="size-4 text-muted" />
                    {c.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Cards sit inside animated wrappers: an animation on the card itself would
            override its hover lift (animations beat normal transform rules). */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-14 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
          {launch && (
            <div className="animate-fade-up md:col-span-2 lg:col-span-7 lg:row-span-2" style={enter(300)}>
              <LaunchCard article={launch.article} product={launch.product} className="h-full" />
            </div>
          )}
          <div className="animate-fade-up lg:col-span-5" style={enter(380)}>
            <PriceWatchCard drops={drops} className="h-full" />
          </div>
          <div className="animate-fade-up lg:col-span-5" style={enter(460)}>
            <NewsCard articles={headlines} className="h-full" />
          </div>
        </div>

        <div className="animate-fade-up mt-4" style={enter(540)}>
          <StatsStrip stats={stats} />
        </div>
      </Container>
    </section>
  );
}

/** Soft indigo wash + a faint dot grid that fades out toward the edges. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48rem 26rem at 50% -6rem, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), radial-gradient(30rem 20rem at 88% 22rem, color-mix(in oklab, var(--positive) 7%, transparent), transparent 70%), radial-gradient(30rem 20rem at 8% 26rem, color-mix(in oklab, var(--accent) 7%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(42rem 22rem at 50% 8rem, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(42rem 22rem at 50% 8rem, #000, transparent 75%)",
        }}
      />
    </div>
  );
}
