"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import type { MouseEvent } from "react";

/** Event the site header can listen for to open the command palette (call preventDefault() when handled). */
export const OPEN_SEARCH_EVENT = "ti:open-search";

/**
 * Big search field in the hero. It looks like an input but opens the global
 * command palette. Without JavaScript (or if the palette isn't mounted) it is
 * a plain link to /search.
 */
export function HeroSearch() {
  function openPalette(e: MouseEvent<HTMLAnchorElement>) {
    // let modified clicks open /search in a new tab as usual
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const custom = new CustomEvent(OPEN_SEARCH_EVENT, { cancelable: true });
    window.dispatchEvent(custom);
    if (custom.defaultPrevented) {
      e.preventDefault();
      return;
    }
    // Until the header handles OPEN_SEARCH_EVENT, fire the palette's own ⌘K / Ctrl+K shortcut.
    // Its handler calls preventDefault(), which tells us the palette opened.
    const shortcut = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(shortcut);
    if (shortcut.defaultPrevented) e.preventDefault();
  }

  return (
    <Link
      href="/search"
      onClick={openPalette}
      aria-label="Search products, categories and news"
      className="btn-glass group flex h-14 w-full items-center gap-3 rounded-full pl-5 pr-2 text-left sm:h-16 sm:pl-6"
      style={{ borderRadius: 9999 }}
    >
      <Search className="size-5 shrink-0 text-muted transition-colors duration-150 group-hover:text-accent" strokeWidth={2} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[15px] text-subtle sm:text-base">
        Search phones, laptops, TVs<span className="hidden sm:inline">, headphones…</span>
      </span>
      <kbd
        className="mr-2 hidden h-7 min-w-7 place-items-center rounded-md border border-line-strong bg-surface px-1.5 font-sans text-xs font-medium text-muted shadow-xs sm:grid"
        aria-hidden
      >
        /
      </kbd>
      <span className="btn-accent grid h-10 place-items-center rounded-full px-4 text-sm font-medium sm:h-12 sm:px-6" aria-hidden>
        Search
      </span>
    </Link>
  );
}
