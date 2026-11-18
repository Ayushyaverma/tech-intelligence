import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuideEditor } from "@/components/admin/guide-editor";
import { productTitle } from "@/lib/admin/templates";
import { getAllGuidesAdmin, getAllProductsAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Edit guide" };

type Params = { id: string };

export default function EditGuidePage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [guides, products] = await Promise.all([getAllGuidesAdmin(), getAllProductsAdmin()]);
  const guide = guides.find((g) => g.id === id);
  if (!guide) notFound();
  return (
    <GuideEditor
      key={guide.id + guide.updatedAt}
      initial={guide}
      takenSlugs={guides.filter((g) => g.id !== id).map((g) => g.slug)}
      products={products
        .filter((p) => p.status !== "archived")
        .map((p) => ({ slug: p.slug, title: productTitle(p), category: p.category, published: p.status === "published" }))}
    />
  );
}
