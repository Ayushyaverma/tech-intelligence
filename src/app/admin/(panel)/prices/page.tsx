import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PriceTable, type PriceRow } from "@/components/admin/price-table";
import { deviceVariant } from "@/components/device-art";
import { latestCheck, staleDays } from "@/lib/admin/insights";
import { productTitle } from "@/lib/admin/templates";
import { getAllProductsAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Prices" };

export default async function AdminPricesPage() {
  const products = (await getAllProductsAdmin()).filter((p) => p.status !== "archived");
  const reference = latestCheck(products);
  const rows: PriceRow[] = products
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: productTitle(p),
      category: p.category,
      art: p.art,
      variant: deviceVariant(p),
      staleDays: staleDays(p, reference),
      offers: p.offers.map((o) => ({ retailer: o.retailer, price: o.price, inStock: o.inStock, checkedAt: o.checkedAt })),
    }))
    .sort((a, b) => (b.staleDays ?? 0) - (a.staleDays ?? 0) || a.title.localeCompare(b.title));

  return (
    <>
      <AdminPageHeader
        eyebrow="Price tracking"
        title="Quick price update"
        description="Edit retailer prices across the catalogue. Every saved price is stamped with the current time, and can be recorded to the product's price history."
      />
      <Suspense fallback={<div className="skeleton h-96" />}>
        <PriceTable rows={rows} />
      </Suspense>
    </>
  );
}
