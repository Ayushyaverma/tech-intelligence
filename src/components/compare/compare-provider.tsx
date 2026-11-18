"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { isCategorySlug, requireCategory } from "@/lib/categories";
import type { CategorySlug } from "@/lib/types";
import type { CompareItem } from "./compare-item";

export type { CompareItem } from "./compare-item";

/**
 * Comparison selection: up to 5 products from ONE category, persisted to
 * localStorage ("ti-compare") and synced across tabs.
 *
 * Implemented as a tiny external store read with useSyncExternalStore: the
 * server (and the first client render) always sees an empty selection, and the
 * saved one appears right after hydration, so there is never a mismatch.
 */

export const COMPARE_MAX = 5;
const STORAGE_KEY = "ti-compare";
const EMPTY: CompareItem[] = [];

type Result = { ok: boolean; reason?: string };

let items: CompareItem[] | null = null; // null = not yet read from storage
const listeners = new Set<() => void>();

function isItem(v: unknown): v is CompareItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.slug === "string" &&
    typeof o.name === "string" &&
    typeof o.brand === "string" &&
    typeof o.category === "string" &&
    isCategorySlug(o.category) &&
    !!o.art &&
    typeof (o.art as Record<string, unknown>).primary === "string"
  );
}

function readStorage(): CompareItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(isItem);
    // Keep the invariants even if storage was edited by hand.
    const first = valid[0]?.category;
    return valid.filter((i) => i.category === first).slice(0, COMPARE_MAX);
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CompareItem[] {
  if (items === null) items = readStorage();
  return items;
}

function getServerSnapshot(): CompareItem[] {
  return EMPTY;
}

function commit(next: CompareItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full / private mode: selection still works for this tab
  }
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  items = readStorage();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/* ---------- actions (module-level, so they are stable references) ---------- */

function add(item: CompareItem): Result {
  const current = getSnapshot();
  if (current.some((i) => i.slug === item.slug)) return { ok: true };
  const category = current[0]?.category;
  if (category && category !== item.category) {
    return {
      ok: false,
      reason: `Comparisons work within one category — clear your ${requireCategory(category).shortName} selection first`,
    };
  }
  if (current.length >= COMPARE_MAX) return { ok: false, reason: `You can compare up to ${COMPARE_MAX} products` };
  commit([...current, item]);
  return { ok: true };
}

function remove(slug: string) {
  const current = getSnapshot();
  if (current.some((i) => i.slug === slug)) commit(current.filter((i) => i.slug !== slug));
}

function toggle(item: CompareItem): Result {
  if (getSnapshot().some((i) => i.slug === item.slug)) {
    remove(item.slug);
    return { ok: true };
  }
  return add(item);
}

function clear() {
  if (getSnapshot().length) commit(EMPTY);
}

/** Replace the whole selection (e.g. from a /compare?ids= link). Invalid mixes are trimmed. */
function replaceAll(next: CompareItem[]) {
  const first = next[0]?.category;
  const seen = new Set<string>();
  commit(
    next
      .filter((i) => i.category === first && !seen.has(i.slug) && seen.add(i.slug))
      .slice(0, COMPARE_MAX),
  );
}

/* ---------- public API ---------- */

export interface CompareApi {
  items: CompareItem[];
  category: CategorySlug | null;
  count: number;
  isFull: boolean;
  has(slug: string): boolean;
  add(item: CompareItem): Result;
  remove(slug: string): void;
  toggle(item: CompareItem): Result;
  clear(): void;
  replaceAll(items: CompareItem[]): void;
}

export function useCompare(): CompareApi {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(
    () => ({
      items: list,
      category: list[0]?.category ?? null,
      count: list.length,
      isFull: list.length >= COMPARE_MAX,
      has: (slug: string) => list.some((i) => i.slug === slug),
      add,
      remove,
      toggle,
      clear,
      replaceAll,
    }),
    [list],
  );
}

/**
 * Mount once in the root layout. The selection lives in a module store, so
 * this wrapper holds no state itself; it marks where compare features are
 * available and is the place to add server sync (accounts) later.
 */
export function CompareProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
