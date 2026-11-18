"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ExternalLink, Save } from "lucide-react";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { DeviceArt, deviceVariant } from "@/components/device-art";
import { ScoreRing } from "@/components/ui/score-ring";
import { Switch } from "@/components/ui/switch";
import { saveProduct } from "@/lib/admin/actions";
import { canVerify, productChecklist, type ChecklistItem } from "@/lib/admin/checklist";
import { isoToIstInput, istInputToIso, todayIst } from "@/lib/admin/dates";
import {
  IDLE,
  RETAILER_SUGGESTIONS,
  SCORE_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  TIER_OPTIONS,
  emptySource,
  nextSourceId,
  resetForCategory,
  uniqueSlug,
} from "@/lib/admin/templates";
import { CATEGORIES, requireCategory } from "@/lib/categories";
import { computeScore, currentPrice, effectiveCriteria } from "@/lib/product-utils";
import type { CategorySlug, Product, SiteSettings, SourceType } from "@/lib/types";
import { cn, formatINR, slugify } from "@/lib/format";
import { AffixInput, Checkbox, ColorInput, CONTROL, Field, Select, TextArea, TextInput } from "./fields";
import { AddButton, RowButtons, StringListEditor } from "./list-editors";
import { Panel } from "./panel";
import { StatusBadge, VerifiedBadge } from "./status-badge";
import { useResultToast } from "./use-result-toast";

type Tab = "basics" | "specs" | "scores" | "content" | "prices" | "reviews" | "appearance" | "verify";

const TABS: { key: Tab; label: string }[] = [
  { key: "basics", label: "Basics" },
  { key: "specs", label: "Specs" },
  { key: "scores", label: "Scores" },
  { key: "content", label: "Content" },
  { key: "prices", label: "Prices" },
  { key: "reviews", label: "Reviews & sources" },
  { key: "appearance", label: "Appearance" },
  { key: "verify", label: "Verify & publish" },
];

interface ProductEditorProps {
  initial: Product;
  settings: Pick<SiteSettings, "weightOverrides">;
  /** slugs used by other products, for auto-slug uniqueness */
  takenSlugs: string[];
}

/**
 * Full product editor. The natural flow is left-to-right through the tabs:
 * basics → specs → scores → content → prices → sources → verify & publish.
 * The whole product is sent to the server action as one JSON payload.
 */
export function ProductEditor({ initial, settings, takenSlugs }: ProductEditorProps) {
  const router = useRouter();
  const isNew = !initial.id;
  const [p, setP] = useState<Product>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("basics");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [result, action, pending] = useActionState(saveProduct, IDLE);

  const dirty = JSON.stringify(p) !== baseline;
  const category = requireCategory(p.category);
  const criteria = effectiveCriteria(category, settings);
  const score = computeScore(p, settings);
  const checklist = useMemo(() => productChecklist(p), [p]);

  useResultToast(result, (r) => {
    const saved = r.data as Product | undefined;
    if (!saved) return;
    setP(saved);
    setBaseline(JSON.stringify(saved));
    if (isNew && r.id) router.replace(`/admin/products/${r.id}`);
  });

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setP((prev) => ({ ...prev, [key]: value }));

  function setName(brand: string, name: string) {
    setP((prev) => ({
      ...prev,
      brand,
      name,
      slug: slugTouched ? prev.slug : uniqueSlug(`${brand} ${name}`, takenSlugs),
    }));
  }

  const title = [p.brand, p.name].filter(Boolean).join(" ") || "New product";

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={JSON.stringify(p)} />

      {/* header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-surface p-2 shadow-xs ring-1 ring-line">
            <DeviceArt category={p.category} primary={p.art.primary} accent={p.art.accent} variant={deviceVariant(p)} className="h-full w-full" />
          </span>
          <div className="min-w-0">
            <Link href="/admin/products" className="text-[13px] font-medium text-muted hover:text-ink">
              ← Products
            </Link>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} />
              <VerifiedBadge verified={p.verified} />
              <span className="text-xs text-muted">
                {category.shortName} · score <span className="font-semibold text-ink tnum">{score}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-warning">Unsaved changes</span>}
          {!isNew && p.status === "published" && (
            <Link
              href={`/product/${initial.slug}`}
              target="_blank"
              className="btn-glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
            >
              <ExternalLink className="size-4" aria-hidden /> View
            </Link>
          )}
          <button
            type="submit"
            disabled={pending || (!dirty && !isNew)}
            className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-50"
          >
            <Save className="size-4" aria-hidden />
            {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 overflow-x-auto bg-bg/80 px-4 py-2 backdrop-blur no-scrollbar lg:top-0 lg:mx-0 lg:px-0">
        <div role="tablist" aria-label="Editor sections" className="inline-flex gap-1 rounded-full bg-surface-2 p-1">
          {TABS.map((t) => {
            const issues = checklist.filter((c) => c.tab === t.key && !c.ok && c.required).length;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                  tab === t.key ? "bg-surface text-ink shadow-xs" : "text-muted hover:text-ink",
                )}
              >
                {t.label}
                {issues > 0 && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-warning align-middle" aria-label="needs attention" />}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "basics" && (
        <Panel title="Basics" description="Identity, positioning and launch details.">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Category" htmlFor="category" hint="Changing the category resets specs, scores and best-for needs.">
              <Select
                id="category"
                value={p.category}
                onChange={(e) => setP((prev) => resetForCategory(prev, e.target.value as CategorySlug))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tier" htmlFor="tier">
              <Select id="tier" value={p.tier} onChange={(e) => set("tier", e.target.value as Product["tier"])}>
                {TIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Brand" htmlFor="brand" required>
              <TextInput id="brand" value={p.brand} onChange={(e) => setName(e.target.value, p.name)} />
            </Field>
            <Field label="Model name" htmlFor="name" required>
              <TextInput id="name" value={p.name} onChange={(e) => setName(p.brand, e.target.value)} />
            </Field>
            <Field
              label="URL slug"
              htmlFor="slug"
              hint={`/product/${p.slug || "…"}`}
              aside={
                !slugTouched ? (
                  "Auto"
                ) : (
                  <button type="button" className="text-accent" onClick={() => { setSlugTouched(false); set("slug", uniqueSlug(`${p.brand} ${p.name}`, takenSlugs)); }}>
                    Reset to auto
                  </button>
                )
              }
            >
              <TextInput
                id="slug"
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                className="font-mono"
              />
            </Field>
            <Field label="Release date" htmlFor="release" required>
              <TextInput id="release" type="date" value={p.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} />
            </Field>
            <Field label="Tagline" htmlFor="tagline" required className="md:col-span-2" aside={`${p.tagline.length}/120`}>
              <TextInput id="tagline" maxLength={120} value={p.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <Field label="Summary" htmlFor="summary" required className="md:col-span-2" hint="Two or three sentences shown on the product page.">
              <TextArea id="summary" rows={4} value={p.summary} onChange={(e) => set("summary", e.target.value)} />
            </Field>
            <Field label="Launch price (MSRP)" htmlFor="msrp" required>
              <AffixInput id="msrp" prefix="₹" inputMode="numeric" value={p.msrp || ""} onChange={(e) => set("msrp", Number(e.target.value.replace(/\D/g, "")) || 0)} />
            </Field>
            <Field label="Popularity" htmlFor="popularity" hint="0–100. Drives “Trending” and the “Most popular” sort.">
              <TextInput id="popularity" type="number" min={0} max={100} value={p.popularity} onChange={(e) => set("popularity", clamp(Number(e.target.value), 0, 100))} />
            </Field>
            <div className="md:col-span-2">
              <Switch checked={!!p.featured} onChange={(v) => set("featured", v)} label="Featured on the homepage" />
            </div>
          </div>
        </Panel>
      )}

      {tab === "specs" && (
        <div className="space-y-6">
          {category.specGroups.map((group) => {
            const fields = category.specs.filter((s) => s.group === group);
            if (!fields.length) return null;
            return (
              <Panel key={group} title={group}>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {fields.map((f) => {
                    const id = `spec-${f.key}`;
                    const v = p.specs[f.key];
                    const setSpec = (val: string | number | boolean) => set("specs", { ...p.specs, [f.key]: val });
                    if (f.type === "boolean") {
                      return (
                        <div key={f.key} className="flex items-end">
                          <Switch checked={v === true} onChange={(c) => setSpec(c)} label={f.label} />
                        </div>
                      );
                    }
                    return (
                      <Field key={f.key} label={f.label} htmlFor={id} hint={f.hint}>
                        {f.type === "number" ? (
                          <AffixInput
                            id={id}
                            type="number"
                            step="any"
                            suffix={f.unit}
                            value={typeof v === "number" ? v : ""}
                            onChange={(e) => setSpec(e.target.value === "" ? "" : Number(e.target.value))}
                          />
                        ) : (
                          <TextInput id={id} value={typeof v === "string" ? v : ""} onChange={(e) => setSpec(e.target.value)} />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {tab === "scores" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Panel title="Sub-scores" description={`Each criterion 0–100, weighted for ${category.name.toLowerCase()}.`}>
            <ul className="space-y-6">
              {criteria.map((c) => {
                const v = p.subScores[c.key];
                const id = `score-${c.key}`;
                return (
                  <li key={c.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor={id} className="text-sm font-medium text-ink">
                        {c.label} <span className="font-normal text-subtle">· {c.weight}%</span>
                      </label>
                      <input
                        aria-label={`${c.label} value`}
                        type="number"
                        min={0}
                        max={100}
                        value={typeof v === "number" && v >= 0 ? v : ""}
                        onChange={(e) => set("subScores", { ...p.subScores, [c.key]: clamp(Number(e.target.value), 0, 100) })}
                        className={cn(CONTROL, "h-8 w-16 text-right tnum")}
                      />
                    </div>
                    <input
                      id={id}
                      type="range"
                      min={0}
                      max={100}
                      value={typeof v === "number" && v >= 0 ? v : 0}
                      onChange={(e) => set("subScores", { ...p.subScores, [c.key]: Number(e.target.value) })}
                      className="mt-2 w-full accent-[var(--accent)]"
                    />
                    <p className="mt-1 text-xs text-muted">{c.description}</p>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <div className="space-y-6">
            <Panel title="Platform score">
              <div className="flex flex-col items-center">
                <ScoreRing score={score} size={140} />
                <p className="mt-3 text-center text-xs text-muted">Updates live as you move the sliders.</p>
              </div>
            </Panel>
            <Panel title="Score type">
              <div className="space-y-2">
                {SCORE_TYPE_OPTIONS.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-surface-2">
                    <input
                      type="radio"
                      name="scoreType"
                      checked={p.scoreType === o.value}
                      onChange={() => set("scoreType", o.value)}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">{o.label}</span>
                      <span className="block text-xs text-muted">{o.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "content" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Pros & cons">
            <div className="space-y-6">
              <StringListEditor label="Pros" items={p.pros} onChange={(v) => set("pros", v)} addLabel="Add pro" />
              <StringListEditor label="Cons" items={p.cons} onChange={(v) => set("cons", v)} addLabel="Add con" />
            </div>
          </Panel>
          <div className="space-y-6">
            <Panel title="Best for" description="Shown on the product page and used by comparison verdicts.">
              <div className="space-y-2">
                {category.needs.map((n) => (
                  <label key={n.key} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-surface-2">
                    <Checkbox
                      checked={p.bestFor.includes(n.key)}
                      onChange={(e) =>
                        set("bestFor", e.target.checked ? [...p.bestFor, n.key] : p.bestFor.filter((k) => k !== n.key))
                      }
                    />
                    <span className="text-sm text-ink">{n.label}</span>
                  </label>
                ))}
              </div>
            </Panel>
            <Panel title="Benchmarks" description="Measured results shown against the category average.">
              <ul className="space-y-3">
                {p.benchmarks.map((b, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_6rem_4.5rem_auto] items-center gap-2">
                    <input aria-label="Benchmark name" value={b.name} onChange={(e) => set("benchmarks", p.benchmarks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={cn(CONTROL, "h-10")} placeholder="Name" />
                    <input aria-label="Value" type="number" value={b.value} onChange={(e) => set("benchmarks", p.benchmarks.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} className={cn(CONTROL, "h-10 tnum")} />
                    <input aria-label="Unit" value={b.unit ?? ""} onChange={(e) => set("benchmarks", p.benchmarks.map((x, j) => (j === i ? { ...x, unit: e.target.value || undefined } : x)))} className={cn(CONTROL, "h-10")} placeholder="unit" />
                    <RowButtons label={b.name || "benchmark"} onRemove={() => set("benchmarks", p.benchmarks.filter((_, j) => j !== i))} />
                  </li>
                ))}
              </ul>
              <AddButton onClick={() => set("benchmarks", [...p.benchmarks, { name: "", value: 0, higherIsBetter: true }])}>Add benchmark</AddButton>
            </Panel>
          </div>
        </div>
      )}

      {tab === "prices" && <PricesTab p={p} set={set} />}

      {tab === "reviews" && (
        <div className="space-y-6">
          <Panel title="Sources" description="Every fact needs a source. At least three are required for verification.">
            <ul className="space-y-4">
              {p.sources.map((s, i) => {
                const upd = (patch: Partial<typeof s>) => set("sources", p.sources.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                return (
                  <li key={s.id} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_8rem_9rem_auto]">
                    <input aria-label="Title" placeholder="Title" value={s.title} onChange={(e) => upd({ title: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <input aria-label="Publisher" placeholder="Publisher" value={s.publisher} onChange={(e) => upd({ publisher: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <select aria-label="Type" value={s.type} onChange={(e) => upd({ type: e.target.value as SourceType })} className={cn(CONTROL, "h-10")}>
                      {SOURCE_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input aria-label="Accessed" type="date" value={s.accessedAt} onChange={(e) => upd({ accessedAt: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <RowButtons label={s.title || "source"} onRemove={() => set("sources", p.sources.filter((_, j) => j !== i))} />
                    <input aria-label="URL" placeholder="https://" value={s.url} onChange={(e) => upd({ url: e.target.value })} className={cn(CONTROL, "h-10 font-mono text-xs md:col-span-4")} />
                  </li>
                );
              })}
            </ul>
            <AddButton onClick={() => set("sources", [...p.sources, { ...emptySource(nextSourceId(p.sources)), accessedAt: todayIst() }])}>Add source</AddButton>
          </Panel>

          <Panel title="Expert reviews" description="Summarise in your own words and link to the original.">
            <ul className="space-y-4">
              {p.reviews.map((r, i) => {
                const upd = (patch: Partial<typeof r>) => set("reviews", p.reviews.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                return (
                  <li key={i} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[minmax(0,1fr)_6rem_9rem_auto]">
                    <input aria-label="Publisher" placeholder="Publisher" value={r.publisher} onChange={(e) => upd({ publisher: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <input aria-label="Rating out of 10" type="number" min={0} max={10} step={0.1} placeholder="/10" value={r.rating ?? ""} onChange={(e) => upd({ rating: e.target.value === "" ? undefined : clamp(Number(e.target.value), 0, 10) })} className={cn(CONTROL, "h-10 tnum")} />
                    <input aria-label="Date" type="date" value={r.date} onChange={(e) => upd({ date: e.target.value })} className={cn(CONTROL, "h-10")} />
                    <RowButtons label={r.publisher || "review"} onRemove={() => set("reviews", p.reviews.filter((_, j) => j !== i))} />
                    <textarea aria-label="Summary" placeholder="Summary" rows={2} value={r.summary} onChange={(e) => upd({ summary: e.target.value })} className={cn(CONTROL, "py-2 md:col-span-4")} />
                    <input aria-label="URL" placeholder="https://" value={r.url} onChange={(e) => upd({ url: e.target.value })} className={cn(CONTROL, "h-10 font-mono text-xs md:col-span-4")} />
                  </li>
                );
              })}
            </ul>
            <AddButton onClick={() => set("reviews", [...p.reviews, { publisher: "", summary: "", url: "", date: todayIst() }])}>Add review</AddButton>
          </Panel>

          <Panel title="User experiences" description="Average owner rating and recurring themes (paraphrased).">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Average rating (0–5)" htmlFor="ux-avg">
                <TextInput id="ux-avg" type="number" min={0} max={5} step={0.1} value={p.userFeedback?.average ?? ""} onChange={(e) => set("userFeedback", { average: clamp(Number(e.target.value), 0, 5), count: p.userFeedback?.count ?? 0, highlights: p.userFeedback?.highlights ?? [] })} />
              </Field>
              <Field label="Number of ratings" htmlFor="ux-count">
                <TextInput id="ux-count" type="number" min={0} value={p.userFeedback?.count ?? ""} onChange={(e) => set("userFeedback", { average: p.userFeedback?.average ?? 0, count: Math.max(0, Math.round(Number(e.target.value))), highlights: p.userFeedback?.highlights ?? [] })} />
              </Field>
            </div>
            <div className="mt-5">
              <StringListEditor
                label="Highlights"
                items={p.userFeedback?.highlights ?? []}
                onChange={(h) => set("userFeedback", { average: p.userFeedback?.average ?? 0, count: p.userFeedback?.count ?? 0, highlights: h })}
                addLabel="Add theme"
              />
            </div>
          </Panel>
        </div>
      )}

      {tab === "appearance" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Panel title="Device colours" description="Used for the generated product artwork across the site.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Body colour" htmlFor="art-primary">
                <ColorInput id="art-primary" label="Body colour" value={p.art.primary} onChange={(v) => set("art", { ...p.art, primary: v })} />
              </Field>
              <Field label="Screen / accent glow" htmlFor="art-accent">
                <ColorInput id="art-accent" label="Accent colour" value={p.art.accent} onChange={(v) => set("art", { ...p.art, accent: v })} />
              </Field>
              <Field label="Photo path (optional)" htmlFor="art-image" hint="A file in /public, e.g. /products/aster-one.png. Leave empty to use the artwork." className="md:col-span-2">
                <TextInput id="art-image" value={p.art.image ?? ""} onChange={(e) => set("art", { ...p.art, image: e.target.value || undefined })} className="font-mono" />
              </Field>
            </div>
            <div className="mt-8">
              <p className="mb-2 text-[13px] font-medium text-ink">Colour options sold</p>
              <ul className="space-y-2">
                {p.colors.map((c, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
                    <input aria-label="Colour name" value={c.name} onChange={(e) => set("colors", p.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={cn(CONTROL, "h-10")} placeholder="Name" />
                    <ColorInput id={`color-${i}`} label={c.name || "colour"} value={c.hex} onChange={(v) => set("colors", p.colors.map((x, j) => (j === i ? { ...x, hex: v } : x)))} />
                    <RowButtons label={c.name || "colour"} onRemove={() => set("colors", p.colors.filter((_, j) => j !== i))} />
                  </li>
                ))}
              </ul>
              <AddButton onClick={() => set("colors", [...p.colors, { name: "", hex: "#888888" }])}>Add colour</AddButton>
            </div>
          </Panel>
          <Panel title="Preview">
            <div
              className="grid aspect-square place-items-center rounded-2xl p-8"
              style={{ background: `radial-gradient(60% 60% at 50% 45%, color-mix(in oklab, ${p.art.accent} 25%, transparent), transparent 70%), var(--surface-2)` }}
            >
              <DeviceArt category={p.category} primary={p.art.primary} accent={p.art.accent} variant={deviceVariant(p)} className="h-full w-full" />
            </div>
          </Panel>
        </div>
      )}

      {tab === "verify" && (
        <div id="verify" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel title="Verification checklist" description="Required items must be complete before the product can be marked verified.">
            <ul className="divide-y divide-line">
              {checklist.map((item) => (
                <ChecklistRow key={item.key} item={item} onGo={() => setTab(item.tab)} />
              ))}
            </ul>
          </Panel>
          <div className="space-y-6">
            <Panel title="Publishing">
              <div className="space-y-5">
                <Switch
                  checked={p.verified}
                  disabled={!canVerify(checklist) && !p.verified}
                  onChange={(v) => set("verified", v)}
                  label="Information verified"
                />
                <Field label="Status" htmlFor="status">
                  <Select id="status" value={p.status} onChange={(e) => set("status", e.target.value as Product["status"])}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <p className="text-xs leading-relaxed text-muted">
                  Publishing makes the product visible in its category, comparisons and search. Remember to save.
                </p>
                <button type="submit" disabled={pending || (!dirty && !isNew)} className="btn-ink h-10 w-full rounded-full text-sm font-medium disabled:opacity-50">
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </form>
  );
}

function ChecklistRow({ item, onGo }: { item: ChecklistItem; onGo: () => void }) {
  const Icon = item.ok ? CheckCircle2 : Circle;
  return (
    <li className="flex items-start gap-3 py-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", item.ok ? "text-positive" : item.required ? "text-warning" : "text-subtle")} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">
          {item.label}
          {!item.required && <span className="ml-2 text-xs font-normal text-subtle">optional</span>}
        </p>
        <p className="text-xs text-muted">{item.detail}</p>
      </div>
      {!item.ok && (
        <button type="button" onClick={onGo} className="shrink-0 text-xs font-medium text-accent hover:text-accent-strong">
          Fix
        </button>
      )}
    </li>
  );
}

function PricesTab({ p, set }: { p: Product; set: <K extends keyof Product>(key: K, value: Product[K]) => void }) {
  const [rec, setRec] = useState({ date: "", price: "", retailer: "" });
  const current = p.offers.length ? currentPrice(p) : 0;

  function addRecord() {
    const price = Number(rec.price);
    if (!rec.date || !price || !rec.retailer.trim()) return;
    const next = [...p.priceHistory.filter((x) => !(x.date === rec.date && x.retailer === rec.retailer.trim())), { date: rec.date, price: Math.round(price), retailer: rec.retailer.trim() }];
    next.sort((a, b) => a.date.localeCompare(b.date));
    set("priceHistory", next);
    setRec({ date: "", price: "", retailer: "" });
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Retailer offers"
        description="Current prices. Mark affiliate links so they are disclosed on the site."
        actions={current ? <span className="text-sm text-muted">Best now <span className="font-semibold text-ink tnum">{formatINR(current)}</span></span> : undefined}
      >
        <datalist id="retailers">
          {RETAILER_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <ul className="space-y-3">
          {p.offers.map((o, i) => {
            const upd = (patch: Partial<typeof o>) => set("offers", p.offers.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <li key={i} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[minmax(0,1fr)_8rem_12rem_auto]">
                <input aria-label="Retailer" list="retailers" placeholder="Retailer" value={o.retailer} onChange={(e) => upd({ retailer: e.target.value })} className={cn(CONTROL, "h-10")} />
                <AffixInput aria-label="Price" prefix="₹" inputMode="numeric" value={o.price || ""} onChange={(e) => upd({ price: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                <input aria-label="Last checked" type="datetime-local" value={isoToIstInput(o.checkedAt)} onChange={(e) => upd({ checkedAt: istInputToIso(e.target.value) ?? o.checkedAt })} className={cn(CONTROL, "h-10")} />
                <RowButtons label={o.retailer || "offer"} onRemove={() => set("offers", p.offers.filter((_, j) => j !== i))} />
                <input aria-label="URL" placeholder="https://" value={o.url} onChange={(e) => upd({ url: e.target.value })} className={cn(CONTROL, "h-10 font-mono text-xs md:col-span-2")} />
                <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <Checkbox checked={o.inStock} onChange={(e) => upd({ inStock: e.target.checked })} /> In stock
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <Checkbox checked={o.affiliate} onChange={(e) => upd({ affiliate: e.target.checked })} /> Affiliate link
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        <AddButton
          onClick={() =>
            set("offers", [...p.offers, { retailer: "", price: 0, url: "", inStock: true, checkedAt: new Date().toISOString(), affiliate: false }])
          }
        >
          Add retailer
        </AddButton>
      </Panel>

      <Panel title="Price history" description="Only add prices you actually recorded. The public graph never fills gaps.">
        {p.priceHistory.length >= 2 && (
          <div className="mb-6">
            <PriceHistoryChart series={[{ name: "Price", points: p.priceHistory }]} height={220} defaultRange="ALL" />
          </div>
        )}
        <div className="grid gap-2 rounded-xl bg-surface-2 p-3 md:grid-cols-[10rem_9rem_minmax(0,1fr)_auto]">
          <input aria-label="Record date" type="date" value={rec.date} onChange={(e) => setRec({ ...rec, date: e.target.value })} className={cn(CONTROL, "h-10")} />
          <AffixInput aria-label="Record price" prefix="₹" inputMode="numeric" value={rec.price} onChange={(e) => setRec({ ...rec, price: e.target.value.replace(/\D/g, "") })} />
          <input aria-label="Record retailer" list="retailers" placeholder="Retailer" value={rec.retailer} onChange={(e) => setRec({ ...rec, retailer: e.target.value })} className={cn(CONTROL, "h-10")} />
          <button type="button" onClick={addRecord} className="btn-ink h-10 rounded-full px-4 text-sm font-medium">
            Add price record
          </button>
        </div>
        <button
          type="button"
          className="mt-2 text-xs font-medium text-accent hover:text-accent-strong"
          onClick={() => {
            const best = [...p.offers].filter((o) => o.price > 0).sort((a, b) => a.price - b.price)[0];
            if (best) setRec({ date: todayIst(), price: String(best.price), retailer: best.retailer });
          }}
        >
          Fill with today’s best offer
        </button>
        <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-3 py-2 font-medium">Date</th>
                <th scope="col" className="px-3 py-2 font-medium">Retailer</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Price</th>
                <th scope="col" className="px-3 py-2"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...p.priceHistory].reverse().map((h) => (
                <tr key={`${h.date}-${h.retailer}`}>
                  <td className="px-3 py-2 tnum text-ink-2">{h.date}</td>
                  <td className="px-3 py-2 text-ink-2">{h.retailer}</td>
                  <td className="px-3 py-2 text-right font-medium text-ink tnum">{formatINR(h.price)}</td>
                  <td className="px-3 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => set("priceHistory", p.priceHistory.filter((x) => x !== h))}
                      className="text-xs text-muted hover:text-negative"
                      aria-label={`Remove record ${h.date}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!p.priceHistory.length && <p className="px-4 py-6 text-center text-sm text-muted">No price records yet.</p>}
        </div>
      </Panel>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
