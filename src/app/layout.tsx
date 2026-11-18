import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { CompareProvider } from "@/components/compare/compare-provider";
import { CompareTray } from "@/components/compare/compare-tray";
import { DemoBanner } from "@/components/layout/demo-banner";
import { PublicOnly } from "@/components/layout/public-only";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/components/layout/site";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { THEME_SCRIPT } from "@/components/layout/theme";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Technology, without the confusion`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: "/",
    title: `${SITE_NAME} — Technology, without the confusion`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d10" },
  ],
};

/* Fallback for admin pages whose path can't be resolved while prerendering:
   the admin shell marks itself with data-admin-shell and public chrome hides. */
const ADMIN_SHELL_CSS = "body:has([data-admin-shell]) [data-site-chrome]{display:none}";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Applies the saved theme before first paint (no light→dark flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <style>{ADMIN_SHELL_CSS}</style>
        {/* Without JavaScript, scroll-reveal content must still be visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="page-ambient flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="btn-ink sr-only rounded-full px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100]"
        >
          Skip to content
        </a>
        <CompareProvider>
          <PublicOnly>
            <DemoBanner />
            <SiteHeader />
          </PublicOnly>
          {/* tabIndex lets the skip link move focus here; global :focus-visible is unlayered, hence inline style */}
          <main id="main" tabIndex={-1} className="flex-1" style={{ outline: "none" }}>
            {children}
          </main>
          <PublicOnly>
            <SiteFooter />
          </PublicOnly>
          {/* The tray reads the pathname, which may suspend while prerendering. */}
          <Suspense fallback={null}>
            <CompareTray />
          </Suspense>
          <Toaster />
        </CompareProvider>
      </body>
    </html>
  );
}
