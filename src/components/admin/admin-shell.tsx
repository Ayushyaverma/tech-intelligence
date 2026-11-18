"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ExternalLink,
  Inbox,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Package,
  Settings,
  BookOpen,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";
import { logout } from "@/lib/admin/auth-actions";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/prices", label: "Prices", icon: IndianRupee },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/guides", label: "Guides", icon: BookOpen },
  { href: "/admin/ads", label: "Advertising", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
];

/** Full-screen admin app shell: sidebar navigation (drawer on mobile) + content area. */
export function AdminShell({ banner, children }: { banner?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  // Close the drawer after navigating.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" aria-label="Admin dashboard" className="flex items-center gap-2.5 rounded-lg">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Tech <span className="text-muted">Intelligence</span>
          </span>
        </Link>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">Admin</span>
      </div>
      <ul className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map((item) => {
          const active = item === current;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
                  active ? "bg-surface text-ink shadow-xs ring-1 ring-line" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <item.icon className={cn("size-4", active ? "text-accent" : "")} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-0.5 border-t border-line px-3 py-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ExternalLink className="size-4" aria-hidden /> View site
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-bg-elevated lg:block">{nav}</aside>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="absolute inset-y-0 left-0 w-72 border-r border-line bg-bg-elevated shadow-lg"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2"
              >
                <X className="size-5" aria-hidden />
              </button>
              {nav}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 shadow-none lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-ink hover:bg-surface-2"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="text-sm font-semibold text-ink">{current?.label ?? "Admin"}</span>
        </header>
        {banner}
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
