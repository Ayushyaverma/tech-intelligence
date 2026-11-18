import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { authMode } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Tech Intelligence" },
  robots: { index: false, follow: false },
};

/** Reminds the admin when the default password is in use. Read at request time so it reflects the real server env. */
async function AuthBanner() {
  await connection();
  if (authMode() !== "default") return null;
  return (
    <div className="flex items-center gap-2 border-b border-line bg-warning-soft px-4 py-2 text-[13px] text-ink-2 sm:px-6 lg:px-10">
      <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden />
      You are using the default password “admin”. To change it, set ADMIN_PASSWORD (and ADMIN_SECRET) on your server.
    </div>
  );
}

/** Static placeholder while the shell (which reads the current path) streams in. */
function ShellFallback() {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]" aria-busy="true">
      <div className="hidden border-r border-line bg-bg-elevated lg:block" />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-10">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-80" />
      </div>
    </div>
  );
}

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    // AdminShell highlights the current page with usePathname(), which is request-time data on [id] routes.
    <Suspense fallback={<ShellFallback />}>
    <AdminShell
      banner={
        <Suspense fallback={null}>
          <AuthBanner />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
    </Suspense>
  );
}
