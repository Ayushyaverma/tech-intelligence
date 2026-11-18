import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/format";

interface ProductSectionProps {
  /** anchor target for the sticky section nav */
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}

/**
 * One block of the product page. `scroll-mt` keeps anchored jumps clear of
 * the sticky site header + section nav.
 */
export function ProductSection({ id, eyebrow, title, description, action, children, className }: ProductSectionProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("scroll-mt-36 py-14 sm:py-20", className)}>
      <Reveal>
        <SectionHeader
          eyebrow={eyebrow}
          title={<span id={id ? `${id}-title` : undefined}>{title}</span>}
          description={description}
          action={action}
        />
      </Reveal>
      {children}
    </section>
  );
}

/** Smaller heading used inside a section ("User experiences", "Key areas" ...). */
export function SubHeading({ title, description, className }: { title: string; description?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-5", className)}>
      <h3 className="text-xl font-semibold tracking-tight text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}
