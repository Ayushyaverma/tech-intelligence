import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductsTable } from "@/components/admin/products-table";
import { latestCheck, toProductRow } from "@/lib/admin/insights";
import { getAllProductsAdmin, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const [products, settings] = await Promise.all([getAllProductsAdmin(), getSettings()]);
  const reference = latestCheck(products);
  const rows = [...products]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((p) => toProductRow(p, settings, reference));

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Add, edit, verify and publish products. Archived products are hidden from the site but keep their data."
        actions={
          <Link href="/admin/products/new" className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium">
            <Plus className="size-4" aria-hidden /> Add product
          </Link>
        }
      />
      <ProductsTable rows={rows} />
    </>
  );
}
