/**
 * Admin-only reads that are NOT part of the cached catalog.
 *
 * Subscribers and contact messages are written by public forms that don't
 * invalidate the catalog cache, so they are read fresh on every request.
 * Callers must sit inside a <Suspense> boundary (connection() defers to request time).
 */
import { connection } from "next/server";
import { readCollection } from "@/lib/store";
import type { ContactMessage, Subscriber } from "@/lib/types";

export async function getSubscribersFresh(): Promise<Subscriber[]> {
  await connection();
  return readCollection("subscribers").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMessagesFresh(): Promise<ContactMessage[]> {
  await connection();
  return readCollection("messages").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
