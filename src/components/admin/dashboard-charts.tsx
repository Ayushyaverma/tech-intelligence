"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryStat } from "@/lib/admin/insights";

const AXIS = { fontSize: 12, fill: "var(--muted)" };

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-ink tnum">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Stacked bars: published / draft / archived products per category. */
export function CategoryChart({ data }: { data: CategoryStat[] }) {
  return (
    <div className="h-64" role="img" aria-label="Products by category">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="published" name="Published" stackId="a" fill="var(--accent)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="draft" name="Draft" stackId="a" fill="var(--warning)" />
          <Bar dataKey="archived" name="Archived" stackId="a" fill="var(--subtle)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Histogram of platform scores (published products). */
export function ScoreChart({ data }: { data: { range: string; count: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Score distribution">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="range" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="count" name="Products" fill="var(--positive)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
