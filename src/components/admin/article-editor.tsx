"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { saveArticle } from "@/lib/admin/actions";
import { isoToIstInput, istInputToIso, todayIst } from "@/lib/admin/dates";
import {
  IDLE,
  NEWS_KIND_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  emptySource,
  estimateReadMinutes,
  nextSourceId,
  uniqueSlug,
} from "@/lib/admin/templates";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug, NewsArticle, NewsKind, SourceType } from "@/lib/types";
import { cn, slugify } from "@/lib/format";
import { Checkbox, CONTROL, Field, Select, TextArea, TextInput } from "./fields";
import { AddButton, RowButtons, StringListEditor } from "./list-editors";
import { Panel } from "./panel";
import { StatusBadge } from "./status-badge";
import { useResultToast } from "./use-result-toast";

export interface ProductOption {
  slug: string;
  title: string;
  category: CategorySlug;
  published: boolean;
}

interface ArticleEditorProps {
  initial: NewsArticle;
  products: ProductOption[];
  takenSlugs: string[];
}

export function ArticleEditor({ initial, products, takenSlugs }: ArticleEditorProps) {
  const router = useRouter();
  const isNew = !initial.id;
  const [a, setA] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [productQuery, setProductQuery] = useState("");
  const [result, action, pending] = useActionState(saveArticle, IDLE);
  const dirty = JSON.stringify(a) !== baseline;

  useResultToast(result, (r) => {
    const saved = r.data as NewsArticle | undefined;
    if (!saved) return;
    setA(saved);
    setBaseline(JSON.stringify(saved));
    if (isNew && r.id) router.replace(`/admin/news/${r.id}`);
  });

  const set = <K extends keyof NewsArticle>(k: K, v: NewsArticle[K]) => setA((p) => ({ ...p, [k]: v }));
  const readMinutes = estimateReadMinutes(a.body);
  const matches = products.filter(
    (p) => !a.productSlugs.includes(p.slug) && productQuery.trim() && p.title.toLowerCase().includes(productQuery.trim().toLowerCase()),
  );

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={JSON.stringify({ ...a, readMinutes })} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link href="/admin/news" className="text-[13px] font-medium text-muted hover:text-ink">
            ← News
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">{a.title || "New article"}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={a.status} />
            <span className="text-xs text-muted">{readMinutes} min read</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-warning">Unsaved changes</span>}
          <button type="submit" disabled={pending || (!dirty && !isNew)} className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-50">
            <Save className="size-4" aria-hidden /> {pending ? "Saving…" : isNew ? "Create article" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel title="Article">
            <div className="space-y-5">
              <Field label="Title" htmlFor="title" required>
                <TextInput
                  id="title"
                  value={a.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setA((p) => ({ ...p, title, slug: slugTouched ? p.slug : uniqueSlug(title, takenSlugs) }));
                  }}
                />
              </Field>
              <Field label="URL slug" htmlFor="slug" hint={`/news/${a.slug || "…"}`}>
                <TextInput id="slug" className="font-mono" value={a.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="Excerpt" htmlFor="excerpt" required hint="One or two sentences for cards and search.">
                <TextArea id="excerpt" rows={2} value={a.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
              </Field>
              <StringListEditor
                label="Body paragraphs (start a paragraph with “## ” for a sub-heading)"
                items={a.body}
                onChange={(v) => set("body", v)}
                multiline
                addLabel="Add paragraph"
              />
            </div>
          </Panel>

          <Panel title="Sources">
            <ul className="space-y-3">
              {a.sources.map((s, i) => {
                const upd = (patch: Partial<typeof s>) => set("sources", a.sources.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                return (
                  <li key={s.id} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto]">
                    <input aria-label="Title" placeholder="Title" value={s.title} onChange={(e) => upd({ title: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <input aria-label="Publisher" placeholder="Publisher" value={s.publisher} onChange={(e) => upd({ publisher: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <select aria-label="Type" value={s.type} onChange={(e) => upd({ type: e.target.value as SourceType })} className={cn(CONTROL, "h-10")}>
                      {SOURCE_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <RowButtons label={s.title || "source"} onRemove={() => set("sources", a.sources.filter((_, j) => j !== i))} />
                    <input aria-label="URL" placeholder="https://" value={s.url} onChange={(e) => upd({ url: e.target.value })} className={cn(CONTROL, "h-10 font-mono text-xs md:col-span-3")} />
                  </li>
                );
              })}
            </ul>
            <AddButton onClick={() => set("sources", [...a.sources, { ...emptySource(nextSourceId(a.sources)), accessedAt: todayIst() }])}>Add source</AddButton>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Publishing">
            <div className="space-y-4">
              <Field label="Status" htmlFor="status">
                <Select id="status" value={a.status} onChange={(e) => set("status", e.target.value as NewsArticle["status"])}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Publish date & time (IST)" htmlFor="published">
                <TextInput id="published" type="datetime-local" value={isoToIstInput(a.publishedAt)} onChange={(e) => set("publishedAt", istInputToIso(e.target.value) ?? "")} />
              </Field>
              <Field label="Author" htmlFor="author" required>
                <TextInput id="author" value={a.author} onChange={(e) => set("author", e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <Checkbox checked={!!a.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured story
              </label>
            </div>
          </Panel>
          <Panel title="Classification">
            <div className="space-y-4">
              <Field label="Kind" htmlFor="kind">
                <Select id="kind" value={a.kind} onChange={(e) => set("kind", e.target.value as NewsKind)}>
                  {NEWS_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Category (optional)" htmlFor="cat">
                <Select id="cat" value={a.category ?? ""} onChange={(e) => set("category", (e.target.value || undefined) as CategorySlug | undefined)}>
                  <option value="">None</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Tags" htmlFor="tags" hint="Comma separated">
                <TextInput id="tags" value={a.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
              </Field>
            </div>
          </Panel>
          <Panel title="Related products">
            <ul className="space-y-1.5">
              {a.productSlugs.map((slug) => {
                const p = products.find((x) => x.slug === slug);
                return (
                  <li key={slug} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                    <span className="truncate text-ink">{p?.title ?? slug}{p && !p.published && <span className="ml-1 text-xs text-warning">(not published)</span>}</span>
                    <button type="button" className="text-xs text-muted hover:text-negative" onClick={() => set("productSlugs", a.productSlugs.filter((s) => s !== slug))}>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="relative mt-3">
              <input aria-label="Find a product" placeholder="Find a product…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className={cn(CONTROL, "h-10")} />
              {matches.length > 0 && (
                <ul className="glass absolute inset-x-0 top-11 z-10 max-h-56 overflow-y-auto rounded-xl p-1">
                  {matches.slice(0, 8).map((p) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => { set("productSlugs", [...a.productSlugs, p.slug]); setProductQuery(""); }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
                      >
                        {p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
