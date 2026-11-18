import type { ComponentProps, ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/format";

interface HomeSectionProps {
  /** anchor id, e.g. "categories" → /#categories */
  id: string;
  header: Omit<ComponentProps<typeof SectionHeader>, "as" | "className">;
  children: ReactNode;
  className?: string;
  /** decorative layer rendered behind the content (gradient bands etc.) */
  backdrop?: ReactNode;
}

/** Standard homepage section: consistent rhythm, revealed header, labelled landmark. */
export function HomeSection({ id, header, children, className, backdrop }: HomeSectionProps) {
  return (
    <section
      id={id}
      aria-label={typeof header.title === "string" ? header.title : header.eyebrow}
      className={cn("relative isolate scroll-mt-24 py-14 sm:py-20", className)}
    >
      {backdrop}
      <Container>
        <Reveal>
          <SectionHeader {...header} />
        </Reveal>
        {children}
      </Container>
    </section>
  );
}
