import { DeviceArt, deviceVariant } from "@/components/device-art";
import type { CategorySlug, Product } from "@/lib/types";
import { cn } from "@/lib/format";

type MontageProduct = Pick<Product, "slug" | "category" | "art" | "specs">;

interface CategoryMontageProps {
  category: CategorySlug;
  /** 1–3 products; the first is drawn front and centre */
  products: MontageProduct[];
  className?: string;
}

/** Slots for the two back devices and the hero device, as % of the 4:3 box. */
const SLOTS = [
  "left-[50%] bottom-[2%] w-[76%] -translate-x-1/2 z-20",
  "left-[-4%] bottom-[16%] w-[58%] z-10 opacity-90 saturate-[0.9]",
  "right-[-4%] bottom-[20%] w-[58%] z-0 opacity-80 saturate-[0.85]",
] as const;

/**
 * Three generated device renders layered into a small still-life, tinted by
 * the products' own colours. Decorative: the products are named elsewhere.
 */
export function CategoryMontage({ category, products, className }: CategoryMontageProps) {
  const items = products.slice(0, 3);
  const glow = items[0]?.art.accent ?? "var(--accent)";
  return (
    <div aria-hidden className={cn("relative aspect-[4/3] w-full", className)}>
      <div
        className="absolute inset-[8%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, color-mix(in oklab, ${glow} 28%, transparent), transparent)` }}
      />
      {items.map((p, i) => (
        <div key={p.slug} className={cn("absolute", SLOTS[i])}>
          <DeviceArt
            category={category}
            primary={p.art.primary}
            accent={p.art.accent}
            variant={deviceVariant(p)}
          />
        </div>
      ))}
    </div>
  );
}
