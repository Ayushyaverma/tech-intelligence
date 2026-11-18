import type { MetadataRoute } from "next";
import { STATIC_ROUTES, SITE_URL } from "@/components/layout/site";
import { CATEGORIES } from "@/lib/categories";
import { getGuides, getNews, getProducts } from "@/lib/data";
import { productHref } from "@/lib/product-utils";

const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

/** Every public route: static pages, categories and all published products, articles and guides. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, news, guides] = await Promise.all([getProducts(), getNews(), getGuides()]);

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: url(path),
      changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : 0.5,
    })),
    ...CATEGORIES.map((c) => ({
      url: url(`/category/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: url(productHref(p)),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...news.map((a) => ({
      url: url(`/news/${a.slug}`),
      lastModified: a.publishedAt,
      priority: 0.6,
    })),
    ...guides.map((g) => ({
      url: url(`/guides/${g.slug}`),
      lastModified: g.updatedAt,
      priority: 0.6,
    })),
  ];
}
