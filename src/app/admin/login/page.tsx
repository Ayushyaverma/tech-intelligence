import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { LogoMark } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="page-ambient relative grid min-h-dvh place-items-center px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_30%,var(--accent-soft),transparent_70%)]"
      />
      <div className="relative w-full max-w-sm">
        <div className="glass rounded-panel p-8">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="size-11" />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Admin sign in</h1>
            <p className="mt-1.5 text-sm text-muted">Manage products, prices, news and advertising.</p>
          </div>
          <div className="mt-8">
            <Suspense fallback={<div className="skeleton h-28" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to the site
        </Link>
      </div>
    </div>
  );
}
