import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { headingId } from "./build";
import { PageHero } from "./page-hero";

export interface PolicySection {
  title: string;
  body: ReactNode;
}

interface PolicyPageProps {
  crumb: string;
  eyebrow: string;
  title: string;
  description: ReactNode;
  /** e.g. "Last updated 17 November 2026" */
  meta?: string;
  /** shown above the sections, e.g. a template notice */
  notice?: ReactNode;
  sections: PolicySection[];
}

/** Long-form page (about, disclosure, privacy, terms): sticky contents list + readable prose. */
export function PolicyPage({ crumb, eyebrow, title, description, meta, notice, sections }: PolicyPageProps) {
  return (
    <>
      <PageHero crumbs={[{ href: "/", label: "Home" }, { label: crumb }]} eyebrow={eyebrow} title={title} description={description}>
        {meta && <p className="mt-6 text-sm text-subtle">{meta}</p>}
      </PageHero>
      <Container className="pb-24">
        <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="eyebrow mb-3">On this page</p>
              <ul className="space-y-2 border-l border-line">
                {sections.map((s) => (
                  <li key={s.title}>
                    <a
                      href={`#${headingId(s.title)}`}
                      className="-ml-px block border-l border-transparent pl-4 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          <div className="max-w-3xl">
            {notice && <div className="mb-10 rounded-card border border-line bg-warning-soft px-5 py-4 text-sm text-ink-2">{notice}</div>}
            <div className="space-y-12">
              {sections.map((s) => (
                <Reveal key={s.title} as="section">
                  <h2 id={headingId(s.title)} className="scroll-mt-28 text-2xl font-semibold tracking-tight text-ink">
                    {s.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-2 [&_a]:font-medium [&_a]:text-accent [&_a:hover]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {s.body}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
