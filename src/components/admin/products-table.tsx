"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Copy, ExternalLink, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { DeviceArt } from "@/components/device-art";
import { ScoreBadge } from "@/components/ui/score";
import { toast } from "@/components/ui/toast";
import { deleteProduct, duplicateProduct, setProductStatus } from "@/lib/admin/actions";
import { formatDayIst } from "@/lib/admin/dates";
import { STALE_DAYS, type ProductRow } from "@/lib/admin/insights";
import type { ActionResult } from "@/lib/admin/templates";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug, PublishStatus } from "@/lib/types";
import { cn, formatINR } from "@/lib/format";
import { ConfirmDialog } from "./confirm-dialog";
import { CONTROL, Select } from "./fields";
import { StatusBadge, VerifiedBadge } from "./status-badge";

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [status, setStatus] = useState<PublishStatus | "">("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [menu, setMenu] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ProductRow | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!needle || `${r.title} ${r.slug}`.toLowerCase().includes(needle)) &&
        (!category || r.category === category) &&
        (!status || r.status === status) &&
        (!verified || (verified === "yes") === r.verified),
    );
  }, [rows, q, category, status, verified]);

  function run(action: () => Promise<ActionResult>, after?: (r: ActionResult) => void) {
    setMenu(null);
    start(async () => {
      const r = await action();
      if (r.ok) {
        toast(r.message ?? "Done", { tone: "positive" });
        after?.(r);
        router.refresh();
      } else toast(r.error ?? "Something went wrong", { tone: "warning" });
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={cn(CONTROL, "h-10 pl-9")} />
        </label>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as CategorySlug | "")} className="h-10 sm:w-40">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.shortName}
            </option>
          ))}
        </Select>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as PublishStatus | "")} className="h-10 sm:w-36">
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <Select aria-label="Verified" value={verified} onChange={(e) => setVerified(e.target.value as "" | "yes" | "no")} className="h-10 sm:w-36">
          <option value="">Verified: any</option>
          <option value="yes">Verified</option>
          <option value="no">Unverified</option>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
              <th scope="col" className="px-3 py-3 font-medium">Score</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Price</th>
              <th scope="col" className="px-3 py-3 font-medium">Prices checked</th>
              <th scope="col" className="px-3 py-3 font-medium">Updated</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.id} className={cn("transition-colors hover:bg-surface-2/60", pending && "opacity-70")}>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2 p-1">
                      <DeviceArt category={r.category} primary={r.art.primary} accent={r.art.accent} variant={r.variant} className="h-full w-full" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink hover:text-accent">{r.title}</span>
                      <span className="block text-xs text-muted">
                        {CATEGORIES.find((c) => c.slug === r.category)?.shortName} · {r.sources} sources · {r.offers} offers
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={r.status} />
                    <VerifiedBadge verified={r.verified} />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <ScoreBadge score={r.score} size="sm" />
                </td>
                <td className="px-3 py-3 text-right font-medium text-ink tnum">{formatINR(r.price)}</td>
                <td className="px-3 py-3 text-xs">
                  <span className={r.staleDays !== null && r.staleDays > STALE_DAYS ? "font-medium text-warning" : "text-muted"}>
                    {formatDayIst(r.lastChecked)}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-muted">{formatDayIst(r.updatedAt)}</td>
                <td className="relative px-4 py-3 text-right">
                  <button
                    type="button"
                    aria-label={`Actions for ${r.title}`}
                    aria-haspopup="menu"
                    aria-expanded={menu === r.id}
                    onClick={() => setMenu(menu === r.id ? null : r.id)}
                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-ink"
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </button>
                  {menu === r.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} aria-hidden />
                      <div role="menu" className="glass absolute right-4 top-12 z-20 w-48 rounded-xl p-1 text-left">
                        <MenuLink href={`/admin/products/${r.id}`} icon={Pencil} label="Edit" />
                        {r.status === "published" && <MenuLink href={`/product/${r.slug}`} icon={ExternalLink} label="View on site" external />}
                        <MenuButton icon={Copy} label="Duplicate" onClick={() => run(() => duplicateProduct(r.id), (res) => res.id && router.push(`/admin/products/${res.id}`))} />
                        {r.status === "archived" ? (
                          <MenuButton icon={ArchiveRestore} label="Restore as draft" onClick={() => run(() => setProductStatus(r.id, "draft"))} />
                        ) : (
                          <MenuButton icon={Archive} label="Archive" onClick={() => run(() => setProductStatus(r.id, "archived"))} />
                        )}
                        <MenuButton icon={Trash2} label="Delete…" danger onClick={() => { setMenu(null); setToDelete(r); }} />
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">No products match these filters.</p>}
      </div>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        Showing {filtered.length} of {rows.length} products
      </p>

      <ConfirmDialog
        open={!!toDelete}
        destructive
        title={`Delete ${toDelete?.title ?? ""}?`}
        description="This permanently removes the product and its price history, and unlinks it from news, guides and comparisons. Archiving is usually the better choice."
        typeToConfirm={toDelete?.slug}
        confirmLabel="Delete permanently"
        pending={pending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const target = toDelete;
          if (!target) return;
          run(() => deleteProduct(target.id, target.slug), () => setToDelete(null));
        }}
      />
    </div>
  );
}

function MenuLink({ href, icon: Icon, label, external }: { href: string; icon: typeof Pencil; label: string; external?: boolean }) {
  return (
    <Link
      role="menuitem"
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Icon className="size-4" aria-hidden /> {label}
    </Link>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-2",
        danger ? "text-negative" : "text-ink-2 hover:text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden /> {label}
    </button>
  );
}
