import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductEditor } from "@/components/admin/product-editor";
import { getAllProductsAdmin, getProductAdmin, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Edit product" };

type Params = { id: string };

/** Admin routes resolve ids at request time (new products appear without a rebuild). */
export default function EditProductPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [product, products, settings] = await Promise.all([getProductAdmin(id), getAllProductsAdmin(), getSettings()]);
  if (!product) notFound();
  return (
    <ProductEditor
      key={product.id + product.updatedAt}
      initial={product}
      settings={{ weightOverrides: settings.weightOverrides }}
      takenSlugs={products.filter((p) => p.id !== product.id).map((p) => p.slug)}
    />
  );
}

function EditorSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-20 w-96 max-w-full" />
      <div className="skeleton h-11 w-full max-w-3xl rounded-full" />
      <div className="skeleton h-96" />
    </div>
  );
}
