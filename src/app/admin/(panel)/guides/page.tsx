import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ContentTable } from "@/components/admin/content-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { deleteGuide, setGuideStatus } from "@/lib/admin/actions";
import { formatDayIst } from "@/lib/admin/dates";
import { requireCategory } from "@/lib/categories";
import { getAllGuidesAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Buying guides" };

export default async function AdminGuidesPage() {
  const guides = await getAllGuidesAdmin();
  return (
    <>
      <AdminPageHeader
        eyebrow="Editorial"
        title="Buying guides"
        description="Ranked recommendations by budget and usage."
        actions={
          <Link href="/admin/guides/new" className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium">
            <Plus className="size-4" aria-hidden /> New guide
          </Link>
        }
      />
      <ContentTable
        noun="guide"
        setStatus={setGuideStatus}
        remove={deleteGuide}
        rows={[...guides]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            meta: `${requireCategory(g.category).name} · ${g.picks.length} picks · updated ${formatDayIst(g.updatedAt)}`,
            editHref: `/admin/guides/${g.id}`,
            publicHref: `/guides/${g.slug}`,
          }))}
      />
    </>
  );
}
