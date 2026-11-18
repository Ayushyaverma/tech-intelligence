import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface AdminPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /** back link above the title, e.g. { href: "/admin/products", label: "Products" } */
  back?: { href: string; label: string };
  actions?: ReactNode;
  /** badges shown beside the title (status, verified …) */
  meta?: ReactNode;
  className?: string;
}

export function AdminPageHeader({ title, description, eyebrow, back, actions, meta, className }: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="group mb-3 inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[2rem] sm:leading-tight">{title}</h1>
          {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
