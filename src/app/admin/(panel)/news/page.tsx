import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ContentTable } from "@/components/admin/content-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { NEWS_KINDS } from "@/components/editorial/news-kind";
import { deleteArticle, setArticleStatus } from "@/lib/admin/actions";
import { formatDayIst } from "@/lib/admin/dates";
import { getAllNewsAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "News" };

export default async function AdminNewsPage() {
  const news = await getAllNewsAdmin();
  return (
    <>
      <AdminPageHeader
        eyebrow="Editorial"
        title="News"
        description="Publish launch news, price watches, industry stories and reviews."
        actions={
          <Link href="/admin/news/new" className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium">
            <Plus className="size-4" aria-hidden /> New article
          </Link>
        }
      />
      <ContentTable
        noun="article"
        setStatus={setArticleStatus}
        remove={deleteArticle}
        rows={news.map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
          meta: `${NEWS_KINDS[a.kind].label} · ${formatDayIst(a.publishedAt)} · ${a.author}`,
          editHref: `/admin/news/${a.id}`,
          publicHref: `/news/${a.slug}`,
        }))}
      />
    </>
  );
}
