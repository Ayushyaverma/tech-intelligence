"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Menu, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useCompare } from "@/components/compare/compare-provider";
import { cn } from "@/lib/format";
import { CommandPalette } from "./command-palette";
import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import type { NavCategory, SearchIndex } from "./search-index";
import { PRIMARY_NAV } from "./site";
import { ThemeToggle } from "./theme-toggle";

/* Scroll position as an external store: true once the page is scrolled. */
function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const getScrolled = () => window.scrollY > 8;

/* "⌘K" on Apple devices, "Ctrl K" elsewhere (decided after hydration). */
const noopSubscribe = () => () => {};
const getShortcut = () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K");

interface HeaderBarProps {
  index: SearchIndex;
  categories: NavCategory[];
}

export function HeaderBar({ index, categories }: HeaderBarProps) {
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, () => false);
  const shortcut = useSyncExternalStore(noopSubscribe, getShortcut, () => "⌘K");
  const { count } = useCompare();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Only one overlay at a time: opening search closes the mobile menu.
  const onPaletteChange = useCallback((open: boolean) => {
    if (open) setMenuOpen(false);
    setPaletteOpen(open);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openSearch = useCallback(() => onPaletteChange(true), [onPaletteChange]);

  return (
    <header data-site-chrome className="sticky top-0 z-50">
      <div className="relative">
        {/* Frosted layer is a sibling (not a parent) of the content so the mega
            menu's own backdrop blur isn't clipped by a nested backdrop root. */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 border-b backdrop-blur-xl backdrop-saturate-[1.8] transition-[background-color,border-color,box-shadow] duration-200",
            scrolled
              ? "border-line bg-[var(--glass-bg-strong)] shadow-[0_8px_24px_-16px_rgba(16,18,24,0.18)]"
              : "border-transparent bg-[var(--glass-bg)]",
          )}
        />
        <Container className="relative flex h-16 items-center gap-2">
          <Logo className="mr-4" />

          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            <MegaMenu categories={categories} />
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="relative inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2/70 hover:text-ink"
                activeClassName="bg-surface-2 text-ink"
              >
                {item.label}
                {item.href === "/compare" && count > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="tnum grid h-[18px] min-w-[18px] animate-fade-up place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink shadow-glow"
                    >
                      {count}
                    </span>
                    <span className="sr-only">({count} selected)</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search"
              aria-keyshortcuts="Meta+K Control+K /"
              className="btn-glass hidden h-9 w-60 items-center gap-2.5 rounded-full pl-3.5 pr-1.5 text-sm text-muted md:inline-flex xl:w-72"
            >
              <Search className="size-4" aria-hidden />
              <span className="flex-1 text-left">Search devices, news…</span>
              <kbd className="rounded-full border border-line bg-surface px-2 py-0.5 font-sans text-[11px] font-medium text-muted">
                {shortcut}
              </kbd>
            </button>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search"
              className="grid size-9 place-items-center rounded-full text-ink-2 transition-[background-color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-95 md:hidden"
            >
              <Search className="size-[18px]" aria-hidden />
            </button>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              className="relative grid size-9 place-items-center rounded-full text-ink-2 transition-[background-color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-95 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
              {count > 0 && (
                <span aria-hidden className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
              )}
            </button>
          </div>
        </Container>
      </div>

      <MobileNav open={menuOpen} onClose={closeMenu} onSearch={openSearch} categories={categories} />
      <CommandPalette index={index} categories={categories} open={paletteOpen} onOpenChange={onPaletteChange} />
    </header>
  );
}
