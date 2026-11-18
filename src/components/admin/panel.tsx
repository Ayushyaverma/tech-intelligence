import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  /** buttons/links aligned to the right of the title */
  actions?: ReactNode;
  icon?: ReactNode;
  /** remove inner padding (tables that run edge to edge) */
  flush?: boolean;
  className?: string;
  id?: string;
  children: ReactNode;
}

/** White card section used across the admin. */
export function Panel({ title, description, actions, icon, flush, className, id, children }: PanelProps) {
  return (
    <section id={id} className={cn("card scroll-mt-24 overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent [&_svg]:size-4">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}
