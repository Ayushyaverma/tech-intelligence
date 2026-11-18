import type { Metadata } from "next";
import { AdsManager } from "@/components/admin/ads-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Advertising" };

export default async function AdminAdsPage() {
  const settings = await getSettings();
  return (
    <>
      <AdminPageHeader
        eyebrow="Monetisation"
        title="Advertising"
        description="Five reserved placements across the site. Switch one on when an advertising partner is in place."
      />
      <AdsManager key={JSON.stringify(settings.adSlots)} initial={settings.adSlots} />
    </>
  );
}
