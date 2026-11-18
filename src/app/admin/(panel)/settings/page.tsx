import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <AdminPageHeader eyebrow="Configuration" title="Settings" description="Site-wide switches and the scoring weights for each category." />
      <SettingsForm key={JSON.stringify(settings)} settings={settings} />
    </>
  );
}
