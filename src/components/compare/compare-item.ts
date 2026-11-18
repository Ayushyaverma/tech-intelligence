import type { CategorySlug, Product, ProductArt } from "@/lib/types";
import { deviceVariant, type DeviceVariant } from "@/components/device-art";

/** The minimal, serialisable slice of a product kept in the compare selection. */
export type CompareItem = {
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  art: ProductArt;
  /** headphones: earbuds vs over-ear drawing in the tray */
  variant?: DeviceVariant;
};

/** Build a CompareItem from a full product. Safe to call in server components. */
export function toCompareItem(
  p: Pick<Product, "slug" | "name" | "brand" | "category" | "art" | "specs">,
): CompareItem {
  const variant = deviceVariant(p);
  return {
    ...(variant ? { variant } : {}),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    art: { primary: p.art.primary, accent: p.art.accent, ...(p.art.image ? { image: p.art.image } : {}) },
  };
}
