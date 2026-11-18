import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

interface Crumb {
  href?: string;
  label: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/** Set NEXT_PUBLIC_SITE_URL in production so the structured data carries absolute URLs. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/** Breadcrumb trail + schema.org BreadcrumbList JSON-LD. The last item is the current page. */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn("text-[13px]", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="truncate rounded-md px-1 py-0.5 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate px-1 py-0.5 font-medium text-ink" aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        // Escape "<" so labels can never break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  );
}
