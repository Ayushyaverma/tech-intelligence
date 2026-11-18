import Link from "next/link";
import { ArrowUpRight, CalendarClock, Clock, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/types";
import { SOURCE_TYPE_LABELS, formatDateTimeIST, formatDay } from "./helpers";

/** Where every fact came from, plus when the page and prices were last updated. */
export function Sources({ product, lastCheckedAt }: { product: Product; lastCheckedAt?: string }) {
  const sources = [...product.sources].sort((a, b) => b.accessedAt.localeCompare(a.accessedAt));
  const updates = [
    { icon: CalendarClock, label: "Page last updated", value: formatDateTimeIST(product.updatedAt) },
    ...(lastCheckedAt ? [{ icon: Clock, label: "Prices last checked", value: formatDateTimeIST(lastCheckedAt) }] : []),
    {
      icon: ShieldCheck,
      label: "Data status",
      value: product.verified ? "Verified by our editors" : "Pending editorial verification",
    },
  ];

  return (
    <Reveal className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">Sources</h3>
          <span className="text-xs text-subtle tnum">{sources.length} referenced</span>
        </div>
        {sources.length ? (
          <ol className="divide-y divide-line">
            {sources.map((s, i) => {
              const type = SOURCE_TYPE_LABELS[s.type];
              return (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="group flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-surface-2/50 sm:px-6"
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-xs font-medium text-subtle tnum">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink group-hover:text-accent">{s.title}</span>
                        <Badge tone={type.tone}>{type.label}</Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {s.publisher} · accessed {formatDay(s.accessedAt)}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="mt-0.5 size-4 shrink-0 text-subtle transition-[transform,color] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      aria-hidden
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="flex items-center gap-2 px-6 py-6 text-sm text-muted">
            <FileText className="size-4" aria-hidden /> Sources will be listed once this page is verified.
          </p>
        )}
      </div>

      <div className="card h-fit p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">Updates</h3>
        <ul className="mt-4 space-y-4">
          {updates.map((u) => (
            <li key={u.label} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted ring-1 ring-inset ring-line">
                <u.icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-xs text-muted">{u.label}</span>
                <span className="block text-sm font-medium text-ink">{u.value}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          Spotted something out of date?{" "}
          <Link href="/contact" className="font-medium text-accent transition-colors duration-150 hover:text-accent-strong">
            Tell us
          </Link>{" "}
          and we&apos;ll re-check it.
        </p>
      </div>
    </Reveal>
  );
}
