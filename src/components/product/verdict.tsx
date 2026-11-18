import { CircleCheck, CircleMinus } from "lucide-react";
import { TIER_LABELS } from "@/components/product-card";
import type { Product } from "@/lib/types";
import { SCORE_TYPE_LABELS, formatDay } from "./helpers";

/** Editorial summary with the headline pro/con and quick facts. */
export function Verdict({ product }: { product: Product }) {
  const facts = [
    { label: "Segment", value: TIER_LABELS[product.tier] },
    { label: "Released", value: formatDay(product.releaseDate) },
    { label: "Score type", value: SCORE_TYPE_LABELS[product.scoreType].label },
    { label: "Reviews linked", value: String(product.reviews.length) },
  ];
  const [pro] = product.pros;
  const [con] = product.cons;

  return (
    <div className="card relative flex h-full flex-col overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: `radial-gradient(80% 100% at 0% 0%, color-mix(in oklab, ${product.art.accent} 14%, transparent), transparent)` }}
      />
      <p className="eyebrow relative">Our verdict</p>
      <p className="relative mt-4 text-lg leading-relaxed text-ink sm:text-xl sm:leading-relaxed">{product.summary}</p>

      {(pro || con) && (
        <ul className="relative mt-6 space-y-2.5 text-sm text-ink-2">
          {pro && (
            <li className="flex items-start gap-2.5">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
              {pro}
            </li>
          )}
          {con && (
            <li className="flex items-start gap-2.5">
              <CircleMinus className="mt-0.5 size-4 shrink-0 text-negative" aria-hidden />
              {con}
            </li>
          )}
        </ul>
      )}

      <div aria-hidden className="min-h-8 flex-1" />
      <dl className="relative grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
