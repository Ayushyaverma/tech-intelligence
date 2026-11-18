import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Clock,
  FileText,
  Gauge,
  IndianRupee,
  Mail,
  Megaphone,
  Newspaper,
  Package,
  PencilLine,
  Plus,
} from "lucide-react";
import { CategoryChart, ScoreChart } from "@/components/admin/dashboard-charts";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/panel";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeviceArt } from "@/components/device-art";
import { getMessagesFresh, getSubscribersFresh } from "@/lib/admin/data";
import { formatDateTimeIst } from "@/lib/admin/dates";
import { categoryStats, needsAttention, scoreDistribution, toProductRow, latestCheck } from "@/lib/admin/insights";
import { getAllGuidesAdmin, getAllNewsAdmin, getAllProductsAdmin, getSettings } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { computeScore } from "@/lib/product-utils";

export const metadata: Metadata = { title: "Dashboard" };

const ATTENTION_ICON = {
  stale: Clock,
  unverified: BadgeCheck,
  draft: PencilLine,
  "article-draft": Newspaper,
  "guide-draft": FileText,
} as const;

export default async function AdminDashboard() {
  const [products, news, guides, settings] = await Promise.all([
    getAllProductsAdmin(),
    getAllNewsAdmin(),
    getAllGuidesAdmin(),
    getSettings(),
  ]);

  const published = products.filter((p) => p.status === "published");
  const drafts = products.filter((p) => p.status === "draft").length;
  const records = products.reduce((n, p) => n + p.priceHistory.length, 0);
  const avgScore = published.length
    ? Math.round(published.reduce((s, p) => s + computeScore(p, settings), 0) / published.length)
    : 0;
  const attention = needsAttention(products, news, guides);
  const reference = latestCheck(products);
  const recent = [...products]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)
    .map((p) => toProductRow(p, settings, reference));
  const liveAds = settings.adSlots.filter((s) => s.enabled).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Everything on the site at a glance. Routine updates never need code: add a product, update prices or publish news from here."
        actions={
          <>
            <Link href="/admin/prices" className="btn-glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink">
              <IndianRupee className="size-4" aria-hidden /> Update prices
            </Link>
            <Link href="/admin/products/new" className="btn-ink inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium">
              <Plus className="size-4" aria-hidden /> Add product
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Package} label="Published products" value={published.length} />
        <Kpi icon={PencilLine} label="Drafts" value={drafts} tone={drafts ? "warning" : undefined} />
        <Kpi icon={BarChart3} label="Price records" value={records.toLocaleString("en-IN")} />
        <Kpi icon={Gauge} label="Avg platform score" value={avgScore} />
        <Kpi icon={Newspaper} label="Articles" value={news.filter((a) => a.status === "published").length} />
        <Suspense fallback={<Kpi icon={Mail} label="Subscribers" value="…" />}>
          <SubscriberKpi />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Products by category" icon={<Package />}>
          <CategoryChart data={categoryStats(products, settings)} />
        </Panel>
        <Panel title="Score distribution" description="Published products, 5-point bands" icon={<Gauge />}>
          <ScoreChart data={scoreDistribution(products, settings)} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel
          title="Needs attention"
          description="Stale prices, unverified products and drafts"
          icon={<AlertTriangle />}
          flush
          actions={<span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2 tnum">{attention.length}</span>}
        >
          {attention.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">All clear — nothing needs attention.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {attention.slice(0, 30).map((item) => {
                const Icon = ATTENTION_ICON[item.kind];
                return (
                  <li key={item.id}>
                    <Link href={item.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2 sm:px-6">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                        <span className="block truncate text-xs text-muted">{item.detail}</span>
                      </span>
                      <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Quick actions" icon={<Plus />}>
            <div className="grid grid-cols-2 gap-3">
              <Quick href="/admin/products/new" icon={Package} label="Add product" />
              <Quick href="/admin/news/new" icon={Newspaper} label="Publish news" />
              <Quick href="/admin/prices" icon={IndianRupee} label="Add prices" />
              <Quick href="/admin/guides/new" icon={FileText} label="New guide" />
            </div>
          </Panel>
          <Panel
            title="Advertising"
            icon={<Megaphone />}
            actions={
              <Link href="/admin/ads" className="text-xs font-medium text-accent hover:text-accent-strong">
                Manage
              </Link>
            }
          >
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink tnum">{liveAds}</span> of {settings.adSlots.length} slots live
            </p>
            <ul className="mt-3 space-y-1.5">
              {settings.adSlots.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate text-muted">{s.location}</span>
                  <span className={s.enabled ? "font-medium text-positive" : "text-subtle"}>{s.enabled ? "On" : "Off"}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Suspense fallback={null}>
            <InboxSummary />
          </Suspense>
        </div>
      </div>

      <Panel title="Recently updated" icon={<Clock />} flush className="mt-6">
        <ul className="divide-y divide-line">
          {recent.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/products/${r.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-2 sm:px-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 p-1.5">
                  <DeviceArt category={r.category} primary={r.art.primary} accent={r.art.accent} variant={r.variant} className="h-full w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                  <span className="block text-xs text-muted">Updated {formatDateTimeIst(r.updatedAt)}</span>
                </span>
                <span className="hidden text-sm text-ink-2 tnum sm:block">{formatINR(r.price)}</span>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

async function SubscriberKpi() {
  const subs = await getSubscribersFresh();
  return <Kpi icon={Mail} label="Subscribers" value={subs.length} />;
}

async function InboxSummary() {
  const [subs, messages] = await Promise.all([getSubscribersFresh(), getMessagesFresh()]);
  return (
    <Panel
      title="Inbox"
      icon={<Mail />}
      actions={
        <Link href="/admin/inbox" className="text-xs font-medium text-accent hover:text-accent-strong">
          Open
        </Link>
      }
    >
      <p className="text-sm text-ink-2">
        <span className="font-semibold text-ink tnum">{messages.length}</span> contact message{messages.length === 1 ? "" : "s"} ·{" "}
        <span className="font-semibold text-ink tnum">{subs.length}</span> subscriber{subs.length === 1 ? "" : "s"}
      </p>
    </Panel>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Package;
  label: string;
  value: number | string;
  tone?: "warning";
}) {
  return (
    <div className="card p-4 sm:p-5">
      <Icon className={tone === "warning" ? "size-4 text-warning" : "size-4 text-accent"} aria-hidden />
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tnum">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function Quick({ href, icon: Icon, label }: { href: string; icon: typeof Package; label: string }) {
  return (
    <Link href={href} className="btn-glass flex flex-col items-start gap-2 rounded-xl p-3 text-sm font-medium text-ink">
      <Icon className="size-4 text-accent" aria-hidden />
      {label}
    </Link>
  );
}
