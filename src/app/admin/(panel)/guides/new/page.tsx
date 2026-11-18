import type { Metadata } from "next";
import { GuideEditor } from "@/components/admin/guide-editor";
import { emptyGuide, productTitle } from "@/lib/admin/templates";
import { getAllGuidesAdmin, getAllProductsAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "New guide" };

export default async function NewGuidePage() {
  const [guides, products] = await Promise.all([getAllGuidesAdmin(), getAllProductsAdmin()]);
  return (
    <GuideEditor
      initial={emptyGuide()}
      takenSlugs={guides.map((g) => g.slug)}
      products={products
        .filter((p) => p.status !== "archived")
        .map((p) => ({ slug: p.slug, title: productTitle(p), category: p.category, published: p.status === "published" }))}
    />
  );
}
