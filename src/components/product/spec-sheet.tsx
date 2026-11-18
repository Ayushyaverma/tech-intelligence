import { Check, ChevronDown, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { TIER_LABELS } from "@/components/product-card";
import type { CategoryConfig, Product, SpecField } from "@/lib/types";
import { formatDay, specText } from "./helpers";

interface SpecRow {
  key: string;
  label: string;
  value: ReactNode;
}

function valueNode(field: SpecField, product: Product): ReactNode {
  const v = product.specs[field.key];
  if (typeof v === "boolean") {
    return v ? (
      <span className="inline-flex items-center gap-1.5">
        <Check className="size-3.5 text-positive" strokeWidth={2.5} aria-hidden /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Minus className="size-3.5" aria-hidden /> No
      </span>
    );
  }
  const text = specText(field, v);
  return text === "None" || text === "—" ? <span className="text-muted">{text}</span> : text;
}

/** Spec groups in the category's order; "General information" (identity + General specs) comes first. */
function buildGroups(product: Product, category: CategoryConfig) {
  const general: SpecRow[] = [
    { key: "brand", label: "Brand", value: product.brand },
    { key: "model", label: "Model", value: product.name },
    { key: "tier", label: "Segment", value: TIER_LABELS[product.tier] },
    { key: "release", label: "Release date", value: formatDay(product.releaseDate) },
  ];
  if (product.colors.length) {
    general.push({
      key: "colours",
      label: product.colors.length > 1 ? "Colours" : "Colour",
      value: (
        <span className="flex flex-wrap gap-x-3 gap-y-1.5">
          {product.colors.map((c) => (
            <span key={c.name} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-full ring-1 ring-inset ring-black/15" style={{ background: c.hex }} />
              {c.name}
            </span>
          ))}
        </span>
      ),
    });
  }

  const byGroup = new Map<string, SpecRow[]>();
  for (const field of category.specs) {
    if (product.specs[field.key] === undefined) continue;
    const row = { key: field.key, label: field.label, value: valueNode(field, product) };
    if (field.group === "General") general.push(row);
    else byGroup.set(field.group, [...(byGroup.get(field.group) ?? []), row]);
  }

  const order = [...category.specGroups.filter((g) => g !== "General"), ...[...byGroup.keys()].filter((g) => !category.specGroups.includes(g))];
  return [
    { name: "General information", rows: general },
    ...order.filter((g) => byGroup.has(g)).map((g) => ({ name: g, rows: byGroup.get(g)! })),
  ];
}

/**
 * Full technical specification, grouped by the category template. Groups are
 * native <details> elements, so they collapse without JavaScript.
 */
export function SpecSheet({ product, category }: { product: Product; category: CategoryConfig }) {
  const groups = buildGroups(product, category);
  return (
    <div className="gap-5 lg:columns-2">
      {groups.map((g) => (
        <details key={g.name} open className="group/spec card mb-5 break-inside-avoid overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface-2/60 sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-ink">{g.name}</span>
              <span className="text-xs text-subtle tnum">{g.rows.length}</span>
            </span>
            <ChevronDown
              className="size-4 text-muted transition-transform duration-200 group-open/spec:rotate-180"
              aria-hidden
            />
          </summary>
          <dl className="px-5 pb-2 sm:px-6">
            {g.rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-t border-line py-3 text-sm"
              >
                <dt className="text-muted">{r.label}</dt>
                <dd className="font-medium text-ink tnum">{r.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}
