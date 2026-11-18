"use client";

import { DeviceArt } from "@/components/device-art";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { cn } from "@/lib/format";
import { STRENGTH_LABELS, type NeedVerdict, type VerdictStrength } from "./compare-logic";
import { NeedIcon } from "./need-icons";
import type { CompareProduct } from "./types";

const STRENGTH_TONE: Record<VerdictStrength, string> = {
  clear: "bg-positive-soft text-positive",
  narrow: "bg-accent-soft text-accent",
  close: "bg-warning-soft text-warning",
  tie: "bg-surface-2 text-ink-2",
};

/** "Best for" cards: a winner per use case instead of one universal winner. */
export function CompareVerdicts({ verdicts }: { verdicts: NeedVerdict[] }) {
  return (
    <section id="best-for" aria-labelledby="best-for-title" className="scroll-mt-44">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Verdicts</p>
          <h2 id="best-for-title" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            The best pick depends on you
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            There is no single winner. Each card ranks these products on the criteria that matter for one kind of
            buyer.
          </p>
        </div>
      </div>
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {verdicts.map((v) => (
          <StaggerItem key={v.key} className="h-full">
            <VerdictCard verdict={v} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function Thumb({ product, className }: { product: CompareProduct; className?: string }) {
  return (
    <span
      className={cn("grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl ring-1 ring-line", className)}
      style={{
        background: `radial-gradient(circle at 50% 45%, color-mix(in oklab, ${product.art.accent} 22%, transparent), transparent 70%), var(--surface-2)`,
      }}
    >
      <DeviceArt
        category={product.category}
        primary={product.art.primary}
        accent={product.art.accent}
        variant={product.item.variant}
        className="w-[118%] max-w-none"
      />
    </span>
  );
}

function VerdictCard({ verdict: v }: { verdict: NeedVerdict }) {
  const tie = v.strength === "tie";
  const winner = v.winners[0];
  const leads = v.drivers.filter((d) => d.diff > 0);
  const trails = v.drivers.filter((d) => d.diff < 0);
  const max = Math.max(...v.ranking.map((r) => r.score), 1);

  return (
    <article className="card card-hover flex h-full flex-col p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2 ring-1 ring-inset ring-line">
            <NeedIcon need={v.key} className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">{v.label}</h3>
            <p className="truncate text-xs text-muted">Based on {v.criteria.map((c) => c.label).join(" + ")}</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STRENGTH_TONE[v.strength])}>
          {STRENGTH_LABELS[v.strength]}
        </span>
      </header>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex -space-x-3">
          {v.winners.slice(0, 3).map((w) => (
            <Thumb key={w.slug} product={w} className="ring-2 ring-surface" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{tie ? "Shared win" : "Winner"}</p>
          <p className="truncate font-semibold text-ink">{v.winners.map((w) => w.name).join(" & ")}</p>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-ink tnum">
          {v.ranking[0]?.score}
          <span className="text-xs font-normal text-subtle">/100</span>
        </p>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        {tie ? (
          <>Both score the same on {v.criteria.map((c) => c.label.toLowerCase()).join(" and ")}. Let price decide.</>
        ) : v.runnerUp ? (
          <>
            Leads {v.runnerUp.product.name} by <strong className="font-semibold text-ink tnum">{v.margin}</strong>{" "}
            {v.margin === 1 ? "point" : "points"}
            {leads.length > 0 && (
              <>
                , ahead on{" "}
                {leads.map((d, i) => (
                  <span key={d.label}>
                    {i > 0 && (i === leads.length - 1 ? " and " : ", ")}
                    {d.label.toLowerCase()} <span className="font-medium text-positive tnum">+{d.diff}</span>
                  </span>
                ))}
              </>
            )}
            {trails.length > 0 && (
              <>
                {" "}despite trailing on {trails.map((d) => d.label.toLowerCase()).join(" and ")}{" "}
                <span className="font-medium text-negative tnum">{trails[0].diff}</span>
              </>
            )}
            .
          </>
        ) : (
          <>{winner?.name} is the only option here.</>
        )}
      </p>

      <div className="mt-auto pt-4">
      <ol className="space-y-1.5 border-t border-line pt-4" aria-label={`${v.label} ranking`}>
        {v.ranking.map((r, i) => {
          const isWinner = v.winners.some((w) => w.slug === r.product.slug);
          return (
            <li key={r.product.slug} className="grid grid-cols-[1rem_minmax(0,1fr)_4.5rem_1.75rem] items-center gap-2 text-xs">
              <span className="text-subtle tnum">{i + 1}</span>
              <span className={cn("truncate", isWinner ? "font-semibold text-ink" : "text-ink-2")}>{r.product.name}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <span
                  className={cn("block h-full rounded-full", isWinner ? "bg-positive" : "bg-subtle/60")}
                  style={{ width: `${(r.score / max) * 100}%` }}
                />
              </span>
              <span className={cn("text-right tnum", isWinner ? "font-semibold text-ink" : "text-muted")}>{r.score}</span>
            </li>
          );
        })}
      </ol>
      </div>
    </article>
  );
}
