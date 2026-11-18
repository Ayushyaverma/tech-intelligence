/**
 * Server-only JSON file store. This is the ONLY module that touches the
 * filesystem. To move to a real database later, re-implement these
 * functions and leave the rest of the app unchanged.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  BuyingGuide,
  NewsArticle,
  Product,
  ContactMessage,
  SiteSettings,
  Subscriber,
  TrendingComparison,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export interface Collections {
  products: Product[];
  news: NewsArticle[];
  guides: BuyingGuide[];
  comparisons: TrendingComparison[];
  settings: SiteSettings;
  subscribers: Subscriber[];
  messages: ContactMessage[];
}

type Name = keyof Collections;

function file(name: Name) {
  return path.join(DATA_DIR, `${name}.json`);
}

/** Synchronous read (predictable I/O — safe inside prerendering / 'use cache'). */
export function readCollection<N extends Name>(name: N): Collections[N] {
  const raw = fs.readFileSync(file(name), "utf-8");
  return JSON.parse(raw) as Collections[N];
}

/** Atomic write: write a temp file then rename over the original. */
export function writeCollection<N extends Name>(name: N, data: Collections[N]): void {
  const target = file(name);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf-8");
  fs.renameSync(tmp, target);
}

/** Read-modify-write helper. */
export function updateCollection<N extends Name>(
  name: N,
  fn: (current: Collections[N]) => Collections[N],
): Collections[N] {
  const next = fn(readCollection(name));
  writeCollection(name, next);
  return next;
}
