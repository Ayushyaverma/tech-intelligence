"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { saveSettings, type SettingsInput } from "@/lib/admin/actions";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/format";
import { CONTROL, Field, TextInput } from "./fields";
import { Panel } from "./panel";

type Weights = Record<CategorySlug, Record<string, number>>;

function initialWeights(settings: SiteSettings): Weights {
  return Object.fromEntries(
    CATEGORIES.map((c) => [
      c.slug,
      Object.fromEntries(c.criteria.map((k) => [k.key, settings.weightOverrides?.[c.slug]?.[k.key] ?? k.weight])),
    ]),
  ) as Weights;
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [siteName, setSiteName] = useState(settings.siteName);
  const [demoMode, setDemoMode] = useState(settings.demoMode);
  const [newsletter, setNewsletter] = useState(settings.newsletterEnabled);
  const [weights, setWeights] = useState<Weights>(() => initialWeights(settings));
  const [active, setActive] = useState<CategorySlug>("phones");

  const category = CATEGORIES.find((c) => c.slug === active)!;
  const w = weights[active];
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const isDefault = category.criteria.every((c) => w[c.key] === c.weight);

  function save() {
    const input: SettingsInput = { siteName, demoMode, newsletterEnabled: newsletter, weightOverrides: weights };
    start(async () => {
      const r = await saveSettings(input);
      if (r.ok) {
        toast(r.message ?? "Saved", { tone: "positive" });
        router.refresh();
      } else toast(r.error ?? "Could not save", { tone: "warning" });
    });
  }

  return (
    <div className="space-y-6">
      <Panel title="General">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Site name" htmlFor="site-name">
            <TextInput id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </Field>
          <div className="space-y-4">
            <div>
              <Switch checked={demoMode} onChange={setDemoMode} label="Show the “sample data” notice" />
              <p className="mt-1 text-xs text-muted">Turn off once real, verified products have replaced the sample data.</p>
            </div>
            <div>
              <Switch checked={newsletter} onChange={setNewsletter} label="Newsletter sign-ups open" />
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Score weights"
        description="How much each criterion counts towards the platform score. Weights are normalised to 100%, and every score in the category is recalculated."
      >
        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={active === c.slug}
              onClick={() => setActive(c.slug)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active === c.slug ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink",
              )}
            >
              <CategoryIcon icon={c.icon} className="size-3.5" /> {c.shortName}
            </button>
          ))}
        </div>
        <ul className="space-y-5">
          {category.criteria.map((c) => {
            const v = w[c.key];
            const pct = Math.round((v / total) * 1000) / 10;
            return (
              <li key={c.key} className="grid items-center gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_5rem_4rem]">
                <label htmlFor={`w-${c.key}`} className="text-sm font-medium text-ink">
                  {c.label}
                  {v !== c.weight && <span className="ml-1.5 text-xs font-normal text-subtle">default {c.weight}</span>}
                </label>
                <input
                  id={`w-${c.key}`}
                  type="range"
                  min={0}
                  max={50}
                  value={v}
                  onChange={(e) => setWeights((all) => ({ ...all, [active]: { ...all[active], [c.key]: Number(e.target.value) } }))}
                  className="w-full accent-[var(--accent)]"
                />
                <input
                  aria-label={`${c.label} weight`}
                  type="number"
                  min={0}
                  max={100}
                  value={v}
                  onChange={(e) => setWeights((all) => ({ ...all, [active]: { ...all[active], [c.key]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } }))}
                  className={cn(CONTROL, "h-9 text-right tnum")}
                />
                <span className="text-right text-sm font-semibold text-ink tnum">{pct}%</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="text-muted">
            Raw total {total} → normalised to 100%
          </span>
          <button
            type="button"
            disabled={isDefault}
            onClick={() => setWeights((all) => ({ ...all, [active]: Object.fromEntries(category.criteria.map((c) => [c.key, c.weight])) }))}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent disabled:text-subtle"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Reset {category.shortName.toLowerCase()} to defaults
          </button>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={pending} className="btn-ink inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium disabled:opacity-50">
          <Save className="size-4" aria-hidden /> {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
