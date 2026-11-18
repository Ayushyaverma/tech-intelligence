import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/format";

interface PageHeroProps {
  crumbs: { href?: string; label: string }[];
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** buttons, stats or a visual shown beside (lg) / below the heading */
  aside?: ReactNode;
  /** content under the description (chips, badges, meta) */
  children?: ReactNode;
  className?: string;
}

/**
 * Standard page opening for editorial and policy pages: breadcrumbs, eyebrow,
 * a large tight heading and muted description over a faint gradient wash.
 */
export function PageHero({ crumbs, eyebrow, title, description, aside, children, className }: PageHeroProps) {
  return (
    <header className={cn("relative isolate overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[30rem] bg-[radial-gradient(55%_60%_at_20%_0%,var(--accent-soft),transparent_70%)]"
      />
      <Container className="pb-10 pt-6 sm:pb-14 sm:pt-8">
        <Breadcrumbs items={crumbs} />
        <div
          className={cn(
            "mt-8 sm:mt-12",
            !!aside && "grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-16",
          )}
        >
          <Reveal className="max-w-3xl">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p>
            )}
            {children && <div className="mt-7">{children}</div>}
          </Reveal>
          {aside && <Reveal delay={0.08}>{aside}</Reveal>}
        </div>
      </Container>
    </header>
  );
}
