import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface CompareSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** controls on the right of the header (toggles, links) */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** pad the body (off for column grids that manage their own spacing) */
  padded?: boolean;
}

/** White card with an icon + title header, used for each block of the comparison. */
export function CompareSection({
  id,
  icon: Icon,
  title,
  description,
  actions,
  children,
  className,
  padded = false,
}: CompareSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("card scroll-mt-44 overflow-hidden", className)}>
      <header className="flex flex-col gap-4 border-b border-line px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent/10">
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("px-3 sm:px-6", padded ? "py-5 sm:py-6" : "pb-2")}>{children}</div>
    </section>
  );
}
