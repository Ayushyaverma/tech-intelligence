"use client";

import { useReducedMotion } from "motion/react";
import { ChartNoAxesColumn, Table2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { Segmented } from "@/components/ui/segmented";
import type { PricePoint } from "@/lib/types";
import { cn, formatINR, formatINRCompact } from "@/lib/format";

export type PriceRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface PriceSeries {
  name: string;
  /** any CSS colour; defaults to the series palette */
  color?: string;
  points: PricePoint[];
}

interface PriceHistoryChartProps {
  series: PriceSeries[];
  height?: number;
  defaultRange?: PriceRange;
  showRangeToggle?: boolean;
  className?: string;
}

const DAY = 86_400_000;
const RANGE_DAYS: Record<PriceRange, number> = { "1M": 30, "3M": 91, "6M": 183, "1Y": 365, ALL: Infinity };
const RANGE_OPTIONS = (Object.keys(RANGE_DAYS) as PriceRange[]).map((r) => ({ value: r, label: r === "ALL" ? "All" : r }));

/**
 * Series palette: indigo, emerald, amber, rose, sky. Defined as CSS variables
 * on the chart wrapper with separate (validated) light and dark steps.
 */
const PALETTE_VARS =
  "[--chart-1:#4f5bd5] [--chart-2:#0f9d6e] [--chart-3:#d48a12] [--chart-4:#e0457b] [--chart-5:#2b9fd9] " +
  "dark:[--chart-1:#8b94ff] dark:[--chart-2:#21a06f] dark:[--chart-3:#c4862a] dark:[--chart-4:#e2527f] dark:[--chart-5:#2d96cb]";
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/* Dates are plain yyyy-mm-dd strings: parse/format in UTC so server, client and every timezone agree. */
function toTime(date: string) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}
const fmtFull = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtDay = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtMonth = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });

/** One merged row per recorded date. s0..s4 = price per series, r0..r4 = retailer. */
type Row = { t: number } & Record<string, number | string | undefined>;

function mergeSeries(series: PriceSeries[]): Row[] {
  const byTime = new Map<number, Row>();
  series.forEach((s, i) => {
    for (const p of s.points) {
      const t = toTime(p.date);
      const row = byTime.get(t) ?? { t };
      const prev = row[`s${i}`];
      // Several retailers on one day: keep the lowest (best) recorded price.
      if (typeof prev !== "number" || p.price < prev) {
        row[`s${i}`] = p.price;
        row[`r${i}`] = p.retailer;
      }
      byTime.set(t, row);
    }
  });
  return [...byTime.values()].sort((a, b) => a.t - b.t);
}

export function PriceHistoryChart({
  series,
  height = 280,
  defaultRange = "6M",
  showRangeToggle = true,
  className,
}: PriceHistoryChartProps) {
  const reduce = useReducedMotion();
  const gid = `phc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [range, setRange] = useState<PriceRange>(defaultRange);
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [showTable, setShowTable] = useState(false);

  const list = useMemo(() => series.slice(0, 5), [series]);
  const colors = list.map((s, i) => s.color ?? PALETTE[i]);
  const single = list.length === 1;

  const allRows = useMemo(() => mergeSeries(list), [list]);

  // Ranges are relative to the LATEST recorded date, never "today".
  const rows = useMemo(() => {
    if (!allRows.length || range === "ALL") return allRows;
    const cutoff = allRows[allRows.length - 1].t - RANGE_DAYS[range] * DAY;
    return allRows.filter((r) => r.t >= cutoff);
  }, [allRows, range]);

  const countIn = (data: Row[], i: number) => data.filter((r) => typeof r[`s${i}`] === "number").length;
  const drawable = list.some((_, i) => countIn(rows, i) >= 2);
  const drawableAll = list.some((_, i) => countIn(allRows, i) >= 2);

  const visible = list.map((_, i) => !hidden.has(i));
  const values = rows.flatMap((r) =>
    list.map((_, i) => (visible[i] ? r[`s${i}`] : undefined)).filter((v): v is number => typeof v === "number"),
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const pad = Math.max((max - min) * 0.18, max * 0.02, 100);
  const yDomain: [number, number] = [Math.max(0, Math.floor((min - pad) / 100) * 100), Math.ceil((max + pad) / 100) * 100];

  const tMin = rows[0]?.t ?? 0;
  const tMax = rows[rows.length - 1]?.t ?? 0;
  const spanDays = (tMax - tMin) / DAY;
  const tickFmt = spanDays > 150 ? fmtMonth : fmtDay;
  const ticks = tMax > tMin ? Array.from({ length: 5 }, (_, i) => Math.round(tMin + ((tMax - tMin) * i) / 4)) : [tMin];

  // Low / high markers for a single series
  let low: Row | undefined;
  let high: Row | undefined;
  if (single) {
    for (const r of rows) {
      const v = r.s0;
      if (typeof v !== "number") continue;
      if (!low || v < (low.s0 as number)) low = r;
      if (!high || v >= (high.s0 as number)) high = r;
    }
    if (low && high && low.s0 === high.s0) high = undefined;
  }

  function toggleSeries(i: number) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < list.length - 1) next.add(i); // keep at least one visible
      return next;
    });
  }

  const latestIn = (i: number) => {
    for (let k = rows.length - 1; k >= 0; k--) {
      const v = rows[k][`s${i}`];
      if (typeof v === "number") return v;
    }
    return undefined;
  };

  return (
    <div className={cn(PALETTE_VARS, "w-full", className)}>
      {/* header: legend (multi-series) + range toggle */}
      {(showRangeToggle || !single) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {!single ? (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label="Series">
              {list.map((s, i) => {
                const latest = latestIn(i);
                return (
                  <li key={`${s.name}-${i}`}>
                    <button
                      type="button"
                      aria-pressed={visible[i]}
                      onClick={() => toggleSeries(i)}
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs ring-1 ring-inset transition-[background-color,opacity] duration-150",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        visible[i] ? "bg-surface text-ink ring-line hover:bg-surface-2" : "bg-transparent text-subtle opacity-70 ring-line hover:opacity-100",
                      )}
                    >
                      <span aria-hidden className="h-0.5 w-3.5 rounded-full" style={{ background: colors[i] }} />
                      <span className="max-w-[10rem] truncate font-medium">{s.name}</span>
                      {latest !== undefined && <span className="text-muted tnum">{formatINRCompact(latest)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span />
          )}
          {showRangeToggle && (
            <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} size="sm" label="Price history range" />
          )}
        </div>
      )}

      {drawable ? (
        <div style={{ height }} className="-ml-2 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 18, right: 12, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[0]} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={colors[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[tMin, tMax]}
                ticks={ticks}
                tickFormatter={(t: number) => tickFmt.format(t)}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--line-strong)" }}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis
                domain={yDomain}
                tickCount={4}
                tickFormatter={(v: number) => formatINRCompact(v)}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
                content={(props) => <ChartTooltip {...props} series={list} colors={colors} visible={visible} />}
                isAnimationActive={false}
              />
              {single ? (
                <Area
                  type="linear"
                  dataKey="s0"
                  name={list[0].name}
                  stroke={colors[0]}
                  strokeWidth={2}
                  fill={`url(#${gid})`}
                  connectNulls
                  dot={rows.length <= 14 ? { r: 2.5, fill: "var(--surface)", stroke: colors[0], strokeWidth: 1.5 } : false}
                  activeDot={{ r: 5, fill: colors[0], stroke: "var(--surface)", strokeWidth: 2 }}
                  isAnimationActive={!reduce}
                  animationDuration={700}
                />
              ) : (
                list.map((s, i) =>
                  visible[i] ? (
                    <Line
                      key={`${s.name}-${i}`}
                      type="linear"
                      dataKey={`s${i}`}
                      name={s.name}
                      stroke={colors[i]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      activeDot={{ r: 4.5, fill: colors[i], stroke: "var(--surface)", strokeWidth: 2 }}
                      isAnimationActive={!reduce}
                      animationDuration={700}
                    />
                  ) : null,
                )
              )}
              {low && (
                <ReferenceDot
                  x={low.t}
                  y={low.s0 as number}
                  r={4}
                  ifOverflow="extendDomain"
                  shape={(p: { cx?: number; cy?: number }) => (
                    <Marker cx={p.cx} cy={p.cy} color={colors[0]} label={`Low ${formatINRCompact(low.s0 as number)}`} below />
                  )}
                />
              )}
              {high && (
                <ReferenceDot
                  x={high.t}
                  y={high.s0 as number}
                  r={4}
                  ifOverflow="extendDomain"
                  shape={(p: { cx?: number; cy?: number }) => (
                    <Marker cx={p.cx} cy={p.cy} color={colors[0]} label={`High ${formatINRCompact(high.s0 as number)}`} />
                  )}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{ minHeight: Math.min(height, 220) }}
          className="grid place-items-center rounded-card border border-dashed border-line-strong bg-surface-2/50 px-6 py-8 text-center"
        >
          <div>
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-surface text-muted shadow-xs ring-1 ring-line">
              <ChartNoAxesColumn className="size-5" aria-hidden />
            </div>
            <p className="text-sm font-medium text-ink">
              {drawableAll ? "No recorded prices in this range" : "Not enough price history yet"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {drawableAll
                ? "Try a longer range to see the full record."
                : "A trend appears once at least two prices have been recorded."}
            </p>
            {drawableAll && range !== "ALL" && (
              <button
                type="button"
                onClick={() => setRange("ALL")}
                className="mt-3 rounded-full px-3 py-1 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
              >
                Show all history
              </button>
            )}
          </div>
        </div>
      )}

      {/* honesty caption + accessible data table */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-subtle">
        <p>Recorded price points only · INR{allRows.length ? ` · last recorded ${fmtFull.format(allRows[allRows.length - 1].t)}` : ""}</p>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <Table2 className="size-3.5" aria-hidden />
            {showTable ? "Hide data" : "View data"}
          </button>
        )}
      </div>
      {showTable && (
        <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs tnum">
            <caption className="sr-only">Recorded prices by date</caption>
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Date</th>
                {list.map((s, i) => (
                  <th key={`${s.name}-${i}`} scope="col" className="px-3 py-2 font-medium">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {[...rows].reverse().map((r) => (
                <tr key={r.t}>
                  <th scope="row" className="whitespace-nowrap px-3 py-1.5 font-normal text-muted">{fmtFull.format(r.t)}</th>
                  {list.map((s, i) => {
                    const v = r[`s${i}`];
                    return (
                      <td key={`${s.name}-${i}`} className="whitespace-nowrap px-3 py-1.5 text-ink-2">
                        {typeof v === "number" ? formatINR(v) : "—"}
                        {typeof v === "number" && r[`r${i}`] ? <span className="ml-1.5 text-subtle">{r[`r${i}`]}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Dot + small pill label for the lowest / highest recorded price. */
function Marker({ cx, cy, color, label, below }: { cx?: number; cy?: number; color: string; label: string; below?: boolean }) {
  if (cx === undefined || cy === undefined) return <g />;
  const w = label.length * 6.2 + 14;
  const y = below ? cy + 10 : cy - 10 - 18;
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
      <rect x={cx - w / 2} y={y} width={w} height={18} rx={9} fill="var(--surface)" stroke="var(--line-strong)" />
      <text x={cx} y={y + 12.5} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink-2)">
        {label}
      </text>
    </g>
  );
}

type ChartTooltipProps = TooltipContentProps & {
  series: PriceSeries[];
  colors: string[];
  visible: boolean[];
};

function ChartTooltip({ active, payload, series, colors, visible }: ChartTooltipProps) {
  const row = payload?.[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  return (
    <div className="glass min-w-44 rounded-xl px-3 py-2.5 text-xs">
      <p className="mb-1.5 font-medium text-muted">{fmtFull.format(row.t)}</p>
      <ul className="space-y-1">
        {series.map((s, i) => {
          if (!visible[i]) return null;
          const v = row[`s${i}`];
          const retailer = row[`r${i}`];
          return (
            <li key={`${s.name}-${i}`} className="flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: colors[i] }} />
              <span className="font-semibold text-ink tnum">{typeof v === "number" ? formatINR(v) : "—"}</span>
              <span className="min-w-0 truncate text-muted">
                {series.length > 1 ? s.name : typeof retailer === "string" ? retailer : ""}
                {series.length > 1 && typeof v === "number" && typeof retailer === "string" ? ` · ${retailer}` : ""}
                {typeof v !== "number" ? " · no record this day" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
