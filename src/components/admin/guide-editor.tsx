"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { saveGuide } from "@/lib/admin/actions";
import { isoToIstInput, istInputToIso } from "@/lib/admin/dates";
import { IDLE, STATUS_OPTIONS, uniqueSlug } from "@/lib/admin/templates";
import { CATEGORIES } from "@/lib/categories";
import type { BuyingGuide, CategorySlug } from "@/lib/types";
import { cn, slugify } from "@/lib/format";
import type { ProductOption } from "./article-editor";
import { AffixInput, CONTROL, Field, Select, TextArea, TextInput } from "./fields";
import { AddButton, RowButtons, StringListEditor } from "./list-editors";
import { Panel } from "./panel";
import { StatusBadge } from "./status-badge";
import { useResultToast } from "./use-result-toast";

interface GuideEditorProps {
  initial: BuyingGuide;
  products: ProductOption[];
  takenSlugs: string[];
}

export function GuideEditor({ initial, products, takenSlugs }: GuideEditorProps) {
  const router = useRouter();
  const isNew = !initial.id;
  const [g, setG] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [result, action, pending] = useActionState(saveGuide, IDLE);
  const dirty = JSON.stringify(g) !== baseline;
  const options = products.filter((p) => p.category === g.category);

  useResultToast(result, (r) => {
    const saved = r.data as BuyingGuide | undefined;
    if (!saved) return;
    setG(saved);
    setBaseline(JSON.stringify(saved));
    if (isNew && r.id) router.replace(`/admin/guides/${r.id}`);
  });

  const set = <K extends keyof BuyingGuide>(k: K, v: BuyingGuide[K]) => setG((p) => ({ ...p, [k]: v }));

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={JSON.stringify(g)} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link href="/admin/guides" className="text-[13px] font-medium text-muted hover:text-ink">
            ← Guides
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">{g.title || "New buying guide"}</h1>
          <div className="mt-2">
            <StatusBadge status={g.status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-warning">Unsaved changes</span>}
          <button type="submit" disabled={pending || (!dirty && !isNew)} className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-50">
            <Save className="size-4" aria-hidden /> {pending ? "Saving…" : isNew ? "Create guide" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel title="Guide">
            <div className="space-y-5">
              <Field label="Title" htmlFor="title" required>
                <TextInput
                  id="title"
                  value={g.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setG((p) => ({ ...p, title, slug: slugTouched ? p.slug : uniqueSlug(title, takenSlugs) }));
                  }}
                />
              </Field>
              <Field label="URL slug" htmlFor="slug" hint={`/guides/${g.slug || "…"}`}>
                <TextInput id="slug" className="font-mono" value={g.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="Excerpt" htmlFor="excerpt" required>
                <TextArea id="excerpt" rows={2} value={g.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Picks" description="Ranked recommendations. Every pick must be a product from this guide's category.">
            <ol className="space-y-3">
              {g.picks.map((pick, i) => {
                const upd = (patch: Partial<typeof pick>) => set("picks", g.picks.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                const move = (d: -1 | 1) => {
                  const next = [...g.picks];
                  [next[i], next[i + d]] = [next[i + d], next[i]];
                  set("picks", next);
                };
                return (
                  <li key={i} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[2rem_minmax(0,1fr)_12rem_auto]">
                    <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent tnum">{i + 1}</span>
                    <select aria-label="Product" value={pick.productSlug} onChange={(e) => upd({ productSlug: e.target.value })} className={cn(CONTROL, "h-10")}>
                      <option value="">Choose a product…</option>
                      {options.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.title}{p.published ? "" : " (not published)"}
                        </option>
                      ))}
                    </select>
                    <input aria-label="Label" placeholder="Best overall" value={pick.label} onChange={(e) => upd({ label: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <RowButtons
                      label={pick.label || `pick ${i + 1}`}
                      onUp={i > 0 ? () => move(-1) : undefined}
                      onDown={i < g.picks.length - 1 ? () => move(1) : undefined}
                      onRemove={() => set("picks", g.picks.filter((_, j) => j !== i))}
                    />
                    <textarea aria-label="Reason" placeholder="Why it earns this spot" rows={2} value={pick.reason} onChange={(e) => upd({ reason: e.target.value })} className={cn(CONTROL, "py-2 md:col-span-3 md:col-start-2")} />
                  </li>
                );
              })}
            </ol>
            <AddButton onClick={() => set("picks", [...g.picks, { productSlug: "", label: "", reason: "" }])}>Add pick</AddButton>
          </Panel>

          <Panel title="Body">
            <StringListEditor label="Paragraphs" items={g.body} onChange={(v) => set("body", v)} multiline addLabel="Add paragraph" />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Publishing">
            <div className="space-y-4">
              <Field label="Status" htmlFor="status">
                <Select id="status" value={g.status} onChange={(e) => set("status", e.target.value as BuyingGuide["status"])}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Publish date & time (IST)" htmlFor="published">
                <TextInput id="published" type="datetime-local" value={isoToIstInput(g.publishedAt)} onChange={(e) => set("publishedAt", istInputToIso(e.target.value) ?? "")} />
              </Field>
              <Field label="Author" htmlFor="author">
                <TextInput id="author" value={g.author} onChange={(e) => set("author", e.target.value)} />
              </Field>
            </div>
          </Panel>
          <Panel title="Scope">
            <div className="space-y-4">
              <Field label="Category" htmlFor="category" hint="Changing the category clears picks from other categories.">
                <Select
                  id="category"
                  value={g.category}
                  onChange={(e) => {
                    const category = e.target.value as CategorySlug;
                    setG((p) => ({
                      ...p,
                      category,
                      picks: p.picks.filter((pick) => products.find((x) => x.slug === pick.productSlug)?.category === category),
                    }));
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Budget ceiling (optional)" htmlFor="budget">
                <AffixInput id="budget" prefix="₹" inputMode="numeric" value={g.budgetMax ?? ""} onChange={(e) => set("budgetMax", Number(e.target.value.replace(/\D/g, "")) || undefined)} />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
