import Link from "next/link";
import { BookCheck, Boxes, LayoutGrid, LineChart, type LucideIcon } from "lucide-react";

export interface HomeStats {
  products: number;
  priceRecords: number;
  categories: number;
  sources: number;
}

const ITEMS: { key: keyof HomeStats; label: string; icon: LucideIcon }[] = [
  { key: "products", label: "Products tracked", icon: Boxes },
  { key: "priceRecords", label: "Price records", icon: LineChart },
  { key: "categories", label: "Categories", icon: LayoutGrid },
  { key: "sources", label: "Sources cited", icon: BookCheck },
];

const num = new Intl.NumberFormat("en-IN");

/** Slim row of catalogue facts, all counted from the data on the server. */
export function StatsStrip({ stats, className }: { stats: HomeStats; className?: string }) {
  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line shadow-xs sm:grid-cols-4">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <li key={key} className="flex items-center gap-3 bg-surface/90 px-4 py-4 sm:px-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted ring-1 ring-line">
              <Icon className="size-4" strokeWidth={1.9} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-semibold leading-none tracking-tight text-ink tnum sm:text-2xl">
                {num.format(stats[key])}
              </p>
              <p className="mt-1 truncate text-xs text-muted sm:text-[13px]">{label}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-center text-xs text-muted sm:text-right">
        Counts reflect the sample dataset in this build.{" "}
        <Link href="/methodology" className="font-medium text-ink-2 underline decoration-line-strong underline-offset-2 transition-colors duration-150 hover:text-ink hover:decoration-current">
          How we collect data
        </Link>
      </p>
    </div>
  );
}
