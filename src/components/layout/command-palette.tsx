"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { ArrowUpRight, CornerDownLeft, Newspaper, Search, TrendingUp } from "lucide-react";
import { DeviceArt } from "@/components/device-art";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ScoreBadge } from "@/components/ui/score";
import { cn, formatINR } from "@/lib/format";
import { PRIMARY_NAV, type NavLinkItem } from "./site";
import type { NavCategory, SearchArticle, SearchIndex, SearchProduct } from "./search-index";
import { useModal } from "./use-modal";

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/** How well one query token matches one text field (0 = no match). */
function tokenScore(text: string, token: string): number {
  const t = text.toLowerCase();
  if (t === token) return 100;
  if (t.startsWith(token)) return 80;
  if (t.includes(` ${token}`) || t.includes(`-${token}`)) return 60;
  if (t.includes(token)) return 40;
  // Loose subsequence ("glxy" → "galaxy") for typos/abbreviations.
  if (token.length >= 3) {
    let i = 0;
    for (const ch of t) if (ch === token[i]) i++;
    if (i === token.length) return 12;
  }
  return 0;
}

/** Every token must match some field; returns the summed, weighted score. */
function rank(fields: [text: string | undefined, weight: number][], tokens: string[]): number {
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [text, weight] of fields) {
      if (text) best = Math.max(best, tokenScore(text, token) * weight);
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

function topMatches<T>(items: T[], score: (item: T) => number, limit: number): T[] {
  return items
    .map((item) => ({ item, s: score(item) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.item);
}

const QUICK_LINKS: NavLinkItem[] = [
  ...PRIMARY_NAV,
  { href: "/category", label: "All categories", description: "Browse every device type" },
  { href: "/methodology", label: "How we score", description: "Weights, sources and methodology" },
  { href: "/about", label: "About Tech Intelligence", description: "Who we are and how we work" },
];

const KIND_LABEL: Record<SearchArticle["kind"], string> = {
  launch: "Launch",
  price: "Price watch",
  industry: "Industry",
  review: "Review",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** yyyy-mm-dd → "12 Nov 2026" without Date parsing (no timezone drift). */
function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ""} ${y}`;
}

type Entry =
  | { kind: "product"; href: string; data: SearchProduct }
  | { kind: "category"; href: string; data: NavCategory }
  | { kind: "article"; href: string; data: SearchArticle }
  | { kind: "link"; href: string; data: NavLinkItem };

interface RawGroup {
  label: string;
  entries: Entry[];
}

interface Group extends RawGroup {
  /** flat index of the group's first entry (for keyboard navigation) */
  start: number;
}

function withOffsets(groups: RawGroup[]): Group[] {
  let start = 0;
  return groups.map((g) => {
    const group = { ...g, start };
    start += g.entries.length;
    return group;
  });
}

function buildGroups(index: SearchIndex, categories: NavCategory[], query: string): Group[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const catName = new Map(categories.map((c) => [c.slug, `${c.name} ${c.shortName}`]));

  if (tokens.length === 0) {
    return withOffsets([
      {
        label: "Trending",
        entries: index.products.slice(0, 5).map((p) => ({ kind: "product", href: p.href, data: p })),
      },
      {
        label: "Categories",
        entries: categories.map((c) => ({ kind: "category", href: `/category/${c.slug}`, data: c })),
      },
    ]);
  }

  const products = topMatches(
    index.products,
    (p) =>
      rank(
        [
          [p.name, 1],
          [`${p.brand} ${p.name}`, 0.95],
          [p.brand, 0.8],
          [catName.get(p.category), 0.5],
        ],
        tokens,
      ),
    6,
  );
  const cats = topMatches(
    categories,
    (c) => rank([[c.name, 1], [c.shortName, 1], [c.tagline, 0.3]], tokens),
    3,
  );
  const articles = topMatches(
    index.articles,
    (a) => rank([[a.title, 1], [a.category ? catName.get(a.category) : undefined, 0.4]], tokens),
    4,
  );
  const links = topMatches(QUICK_LINKS, (l) => rank([[l.label, 1], [l.description, 0.4]], tokens), 3);

  const groups: RawGroup[] = [
    { label: "Products", entries: products.map((p) => ({ kind: "product", href: p.href, data: p })) },
    { label: "Categories", entries: cats.map((c) => ({ kind: "category", href: `/category/${c.slug}`, data: c })) },
    { label: "Articles", entries: articles.map((a) => ({ kind: "article", href: a.href, data: a })) },
    { label: "Quick links", entries: links.map((l) => ({ kind: "link", href: l.href, data: l })) },
  ];
  return withOffsets(groups.filter((g) => g.entries.length > 0));
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface CommandPaletteProps {
  index: SearchIndex;
  categories: NavCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** True when the keyboard event comes from a place the user is typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/**
 * Global search (⌘K / Ctrl+K or "/"). Always mounted so the shortcuts work
 * everywhere; the dialog itself only renders while open, which also resets
 * the query each time it opens.
 */
export function CommandPalette({ index, categories, open, onOpenChange }: CommandPaletteProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "/" && !open && !isTypingTarget(e.target)) {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <PaletteDialog key="palette" index={index} categories={categories} onClose={close} />
      )}
    </AnimatePresence>
  );
}

function PaletteDialog({
  index,
  categories,
  onClose,
}: {
  index: SearchIndex;
  categories: NavCategory[];
  onClose: () => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  // Release scroll lock / focus as soon as the exit animation starts, not after it.
  const isPresent = useIsPresent();
  useModal(isPresent, panelRef, onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const groups = useMemo(() => buildGroups(index, categories, query.trim()), [index, categories, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);
  const activeIndex = flat.length ? Math.min(active, flat.length - 1) : -1;
  const trimmed = query.trim();
  const searchHref = `/search${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`;

  // Keep the highlighted row visible while arrowing through long lists.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + delta + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(activeIndex >= 0 ? flat[activeIndex].href : searchHref);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[max(1rem,10vh)] sm:px-6",
        !isPresent && "pointer-events-none",
      )}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[rgba(12,13,16,0.28)] backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.18 }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search Tech Intelligence"
        className="glass relative flex max-h-[min(640px,80dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-panel shadow-lg"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.985 }}
        transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Search field */}
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            aria-autocomplete="list"
            placeholder="Search products, brands, categories, news…"
            className="h-16 w-full bg-transparent text-[17px] text-ink placeholder:text-subtle"
            style={{ outline: "none" }}
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted sm:inline-block">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto overscroll-contain p-2">
          {flat.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
                <Search className="size-5" aria-hidden />
              </div>
              <p className="font-medium text-ink">No quick matches for “{trimmed}”</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Try a brand, a model name or a category — or run a full search.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label} className="py-1">
                <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  {group.label === "Trending" && <TrendingUp className="size-3.5" aria-hidden />}
                  {group.label}
                </div>
                {group.entries.map((entry, j) => {
                  const i = group.start + j;
                  return (
                    <ResultRow
                      key={`${entry.kind}-${entry.href}`}
                      id={`${listId}-${i}`}
                      index={i}
                      entry={entry}
                      active={i === activeIndex}
                      categories={categories}
                      onHover={() => setActive(i)}
                      onSelect={onClose}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/50 px-4 py-2.5 text-xs text-muted">
          <div className="hidden items-center gap-3 sm:flex">
            <Hint keys={["↑", "↓"]}>navigate</Hint>
            <Hint keys={["↵"]}>open</Hint>
          </div>
          <Link
            href={searchHref}
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            {trimmed ? <>See all results for “{trimmed}”</> : "Open full search"}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function Hint({ keys, children }: { keys: string[]; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k) => (
        <kbd key={k} className="min-w-5 rounded border border-line bg-surface px-1 text-center font-sans text-[11px] text-ink-2">
          {k}
        </kbd>
      ))}
      <span className="ml-0.5">{children}</span>
    </span>
  );
}

function ResultRow({
  id,
  index,
  entry,
  active,
  categories,
  onHover,
  onSelect,
}: {
  id: string;
  index: number;
  entry: Entry;
  active: boolean;
  categories: NavCategory[];
  onHover: () => void;
  onSelect: () => void;
}) {
  let thumb: ReactNode;
  let title: string;
  let meta: string | undefined;
  let trailing: ReactNode = null;

  switch (entry.kind) {
    case "product": {
      const p = entry.data;
      thumb = (
        <DeviceArt
          category={p.category}
          primary={p.art.primary}
          accent={p.art.accent}
          variant={p.earbuds ? "earbuds" : undefined}
          className="w-8"
        />
      );
      title = p.name;
      meta = `${p.brand} · ${categories.find((c) => c.slug === p.category)?.shortName ?? p.category}`;
      trailing = (
        <span className="flex items-center gap-3">
          <span className="tnum hidden text-sm font-medium text-ink-2 sm:inline">{formatINR(p.price)}</span>
          <ScoreBadge score={p.score} size="sm" />
        </span>
      );
      break;
    }
    case "category":
      thumb = <CategoryIcon icon={entry.data.icon} className="size-[18px] text-ink-2" />;
      title = entry.data.name;
      meta = entry.data.tagline;
      break;
    case "article":
      thumb = <Newspaper className="size-[18px] text-ink-2" aria-hidden />;
      title = entry.data.title;
      meta = `${KIND_LABEL[entry.data.kind]} · ${formatYmd(entry.data.date)}`;
      break;
    case "link":
      thumb = <ArrowUpRight className="size-[18px] text-ink-2" aria-hidden />;
      title = entry.data.label;
      meta = entry.data.description;
      break;
  }

  return (
    <Link
      id={id}
      href={entry.href}
      role="option"
      aria-selected={active}
      data-index={index}
      tabIndex={-1}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100",
        active ? "bg-accent-soft" : "hover:bg-surface-2",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line bg-surface">
        {thumb}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-ink">{title}</span>
        {meta && <span className="block truncate text-[13px] text-muted">{meta}</span>}
      </span>
      {trailing}
      <CornerDownLeft
        className={cn("size-4 shrink-0 text-accent transition-opacity", active ? "opacity-100" : "opacity-0")}
        aria-hidden
      />
    </Link>
  );
}
