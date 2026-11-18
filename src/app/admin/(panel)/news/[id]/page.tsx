import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleEditor } from "@/components/admin/article-editor";
import { productTitle } from "@/lib/admin/templates";
import { getAllNewsAdmin, getAllProductsAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Edit article" };

type Params = { id: string };

export default function EditArticlePage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [news, products] = await Promise.all([getAllNewsAdmin(), getAllProductsAdmin()]);
  const article = news.find((a) => a.id === id);
  if (!article) notFound();
  return (
    <ArticleEditor
      key={article.id + JSON.stringify(article).length}
      initial={article}
      takenSlugs={news.filter((a) => a.id !== id).map((a) => a.slug)}
      products={products.map((p) => ({ slug: p.slug, title: productTitle(p), category: p.category, published: p.status === "published" }))}
    />
  );
}
