import { CircleCheck, CircleMinus, Target } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { needScore } from "@/lib/product-utils";
import type { CategoryConfig, Product } from "@/lib/types";
import { cn } from "@/lib/format";

function List({ title, items, kind }: { title: string; items: string[]; kind: "pro" | "con" }) {
  const Icon = kind === "pro" ? CircleCheck : CircleMinus;
  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-24", kind === "pro" ? "bg-positive-soft" : "bg-negative-soft")}
        style={{ maskImage: "linear-gradient(180deg, #000, transparent)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent)" }}
      />
      <h3 className={cn("relative flex items-center gap-2 text-lg font-semibold tracking-tight", kind === "pro" ? "text-positive" : "text-negative")}>
        <Icon className="size-5" aria-hidden />
        {title}
      </h3>
      <ul className="relative mt-5 space-y-3.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-2">
            <Icon className={cn("mt-1 size-4 shrink-0", kind === "pro" ? "text-positive" : "text-negative")} strokeWidth={2} aria-hidden />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pros, cons and the "best for" needs this product suits. */
export function ProsCons({ product, category }: { product: Product; category: CategoryConfig }) {
  const needs = category.needs.filter((n) => product.bestFor.includes(n.key));
  return (
    <div className="space-y-5">
      <Reveal className="grid gap-5 md:grid-cols-2">
        <List title="What we like" items={product.pros} kind="pro" />
        <List title="What could be better" items={product.cons} kind="con" />
      </Reveal>
      {needs.length > 0 && (
        <Reveal className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <p className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
            <Target className="size-4 text-accent" aria-hidden />
            Best for
          </p>
          <ul className="flex flex-wrap gap-2">
            {needs.map((n) => (
              <li
                key={n.key}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-accent-soft pl-3.5 pr-1.5 text-[13px] font-medium text-accent ring-1 ring-inset ring-accent/15"
              >
                {n.label}
                <span className="sr-only">, need score</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-2 tnum" title="Average of the related sub-scores">
                  {needScore(product, n.criteria)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}
