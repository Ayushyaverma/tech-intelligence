import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-2xl text-center">
        {/* Oversized, faded numerals as a quiet backdrop */}
        <p
          aria-hidden
          className="pointer-events-none select-none bg-linear-to-b from-ink/15 to-transparent bg-clip-text text-[7.5rem] font-semibold leading-none tracking-tighter text-transparent sm:text-[11rem]"
        >
          404
        </p>
        <p className="eyebrow -mt-6 sm:-mt-10">Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          This page took a different route.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
          The link may be outdated, or the product may have left our catalogue. Search for it, or pick up
          from a category below.
        </p>

        <Form action="/search" role="search" className="mx-auto mt-8 max-w-md">
          <label htmlFor="nf-search" className="sr-only">
            Search Tech Intelligence
          </label>
          <div className="glass flex items-center gap-2 rounded-full p-1.5 pl-4">
            <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
            <input
              id="nf-search"
              name="q"
              type="search"
              placeholder="Search phones, laptops, brands…"
              className="h-10 w-full min-w-0 bg-transparent text-[15px] text-ink placeholder:text-subtle"
              style={{ outline: "none" }}
            />
            <button
              type="submit"
              className="btn-ink inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium"
            >
              Search
            </button>
          </div>
        </Form>
      </div>

      <ul className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/category/${c.slug}`}
              className="card card-hover group flex items-center gap-3 p-4 active:scale-[0.98]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2 transition-colors duration-150 group-hover:text-accent">
                <CategoryIcon icon={c.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">{c.shortName}</span>
              <ArrowRight
                className="size-4 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" variant="ink">
          Back to home
        </ButtonLink>
        <ButtonLink href="/deals" variant="glass">
          Browse price drops
        </ButtonLink>
      </div>
    </Container>
  );
}
