"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { saveAdSlots } from "@/lib/admin/actions";
import type { AdSlot } from "@/lib/types";
import { Field, TextArea, TextInput } from "./fields";
import { Panel } from "./panel";

/** The five reserved placements: an on/off switch, sponsor content and a live preview each. */
export function AdsManager({ initial }: { initial: AdSlot[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(slots) !== JSON.stringify(initial);

  const upd = (id: string, patch: Partial<AdSlot>) => setSlots((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  function save() {
    start(async () => {
      const r = await saveAdSlots(slots);
      if (r.ok) {
        toast(r.message ?? "Saved", { tone: "positive" });
        router.refresh();
      } else toast(r.error ?? "Could not save", { tone: "warning" });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface-2 px-5 py-4 text-sm text-ink-2">
        <p>Slots are disabled by default and never influence scores, rankings or comparisons. Enabled slots are labelled “Sponsored”.</p>
        <button type="button" onClick={save} disabled={!dirty || pending} className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-50">
          <Save className="size-4" aria-hidden /> {pending ? "Saving…" : "Save all"}
        </button>
      </div>

      {slots.map((s) => (
        <Panel
          key={s.id}
          title={
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{s.label}</span>
              {s.location}
            </span>
          }
          description={<code className="text-[12px]">{s.id}</code>}
          actions={<Switch checked={s.enabled} onChange={(v) => upd(s.id, { enabled: v })} label={s.enabled ? "Live" : "Off"} />}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sponsor" htmlFor={`${s.id}-sponsor`} required={s.enabled}>
                <TextInput id={`${s.id}-sponsor`} value={s.sponsor ?? ""} onChange={(e) => upd(s.id, { sponsor: e.target.value })} />
              </Field>
              <Field label="Link" htmlFor={`${s.id}-url`}>
                <TextInput id={`${s.id}-url`} placeholder="https://" value={s.url ?? ""} onChange={(e) => upd(s.id, { url: e.target.value })} className="font-mono text-xs" />
              </Field>
              <Field label="Headline" htmlFor={`${s.id}-headline`} required={s.enabled} className="sm:col-span-2">
                <TextInput id={`${s.id}-headline`} value={s.headline ?? ""} onChange={(e) => upd(s.id, { headline: e.target.value })} />
              </Field>
              <Field label="Body" htmlFor={`${s.id}-body`} className="sm:col-span-2">
                <TextArea id={`${s.id}-body`} rows={2} value={s.body ?? ""} onChange={(e) => upd(s.id, { body: e.target.value })} />
              </Field>
            </div>
            <div>
              <p className="eyebrow mb-2">Preview</p>
              <div className={s.enabled ? "" : "opacity-50"}>
                <div className="card relative overflow-hidden p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Sponsored{s.sponsor ? ` · ${s.sponsor}` : ""}</p>
                  <p className="mt-2 font-semibold text-ink">{s.headline || "Headline"}</p>
                  {s.body && <p className="mt-1 text-sm text-muted">{s.body}</p>}
                  {s.url && (
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Learn more <ExternalLink className="size-3.5" aria-hidden />
                    </span>
                  )}
                </div>
              </div>
              {!s.enabled && <p className="mt-2 text-xs text-muted">Off — nothing is shown on the site.</p>}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
