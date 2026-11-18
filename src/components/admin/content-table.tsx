"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/admin/templates";
import type { PublishStatus } from "@/lib/types";
import { cn } from "@/lib/format";
import { ConfirmDialog } from "./confirm-dialog";
import { CONTROL, Select } from "./fields";
import { StatusBadge } from "./status-badge";

export interface ContentRow {
  id: string;
  title: string;
  status: PublishStatus;
  /** secondary line, e.g. "Launch · 16 Nov 2026" */
  meta: string;
  editHref: string;
  publicHref: string;
}

interface ContentTableProps {
  rows: ContentRow[];
  noun: string;
  setStatus: (id: string, status: PublishStatus) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
}

/** List of articles or guides with quick publish/unpublish and delete. */
export function ContentTable({ rows, noun, setStatus, remove }: ContentTableProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatusFilter] = useState<PublishStatus | "">("");
  const [toDelete, setToDelete] = useState<ContentRow | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase())) && (!status || r.status === status),
      ),
    [rows, q, status],
  );

  function run(fn: () => Promise<ActionResult>, after?: () => void) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast(r.message ?? "Done", { tone: "positive" });
        after?.();
        router.refresh();
      } else toast(r.error ?? "Something went wrong", { tone: "warning" });
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search {noun}s</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${noun}s…`} className={cn(CONTROL, "h-10 pl-9")} />
        </label>
        <Select aria-label="Status" value={status} onChange={(e) => setStatusFilter(e.target.value as PublishStatus | "")} className="h-10 sm:w-40">
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      <ul className={cn("divide-y divide-line", pending && "opacity-70")}>
        {filtered.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
            <Link href={r.editHref} className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink hover:text-accent">{r.title}</span>
              <span className="block text-xs text-muted">{r.meta}</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={r.status} />
              {r.status === "published" ? (
                <button type="button" onClick={() => run(() => setStatus(r.id, "draft"))} className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-2">
                  Unpublish
                </button>
              ) : (
                <button type="button" onClick={() => run(() => setStatus(r.id, "published"))} className="rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft">
                  Publish
                </button>
              )}
              <Link href={r.editHref} aria-label={`Edit ${r.title}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
                <Pencil className="size-4" aria-hidden />
              </Link>
              {r.status === "published" && (
                <Link href={r.publicHref} target="_blank" aria-label={`View ${r.title}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
                  <ExternalLink className="size-4" aria-hidden />
                </Link>
              )}
              <button type="button" onClick={() => setToDelete(r)} aria-label={`Delete ${r.title}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-negative-soft hover:text-negative">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">Nothing here yet.</p>}
      <ConfirmDialog
        open={!!toDelete}
        destructive
        title={`Delete this ${noun}?`}
        description={<>“{toDelete?.title}” will be removed permanently.</>}
        confirmLabel="Delete"
        pending={pending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          if (t) run(() => remove(t.id), () => setToDelete(null));
        }}
      />
    </div>
  );
}
