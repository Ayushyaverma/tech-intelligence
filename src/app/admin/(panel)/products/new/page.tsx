import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/product-editor";
import { emptyProduct } from "@/lib/admin/templates";
import { getAllProductsAdmin, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [products, settings] = await Promise.all([getAllProductsAdmin(), getSettings()]);
  return (
    <ProductEditor
      initial={emptyProduct("phones")}
      settings={{ weightOverrides: settings.weightOverrides }}
      takenSlugs={products.map((p) => p.slug)}
    />
  );
}
