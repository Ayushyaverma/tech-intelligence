import type { Metadata } from "next";
import { ArticleEditor } from "@/components/admin/article-editor";
import { emptyArticle, productTitle } from "@/lib/admin/templates";
import { getAllNewsAdmin, getAllProductsAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  const [news, products] = await Promise.all([getAllNewsAdmin(), getAllProductsAdmin()]);
  return (
    <ArticleEditor
      initial={emptyArticle()}
      takenSlugs={news.map((a) => a.slug)}
      products={products.map((p) => ({ slug: p.slug, title: productTitle(p), category: p.category, published: p.status === "published" }))}
    />
  );
}
