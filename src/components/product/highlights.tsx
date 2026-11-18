import {
  AudioLines,
  BatteryCharging,
  Camera,
  Ear,
  Gamepad2,
  Headphones,
  Monitor,
  PenTool,
  Plug,
  Ruler,
  Sun,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { ScoreBadge } from "@/components/ui/score";
import { StaggerItem, Stagger } from "@/components/ui/reveal";
import { specField } from "@/lib/product-utils";
import type { CategoryConfig, CategorySlug, Product } from "@/lib/types";
import { hasValue, specText } from "./helpers";

/**
 * Category-relevant "living with it" areas, each built from one or more spec
 * groups of the category template. Laptops never get a camera card and
 * headphones never get a display card. Edit this map to change the cards.
 */
interface HighlightDef {
  title: string;
  icon: LucideIcon;
  /** spec groups (from the category config) whose specs fill the card */
  groups: string[];
  /** sub-score shown on the card */
  criterion?: string;
  /** spec keys whose formatted values form the large headline */
  lead: string[];
  /** hide the card when this spec is false / 0 (e.g. battery on wired headphones) */
  requires?: string;
}

const HIGHLIGHTS: Record<CategorySlug, HighlightDef[]> = {
  phones: [
    { title: "Display & design", icon: Sun, groups: ["Display", "Design"], criterion: "display", lead: ["displaySize", "displayType"] },
    { title: "Cameras", icon: Camera, groups: ["Camera"], criterion: "camera", lead: ["mainCamera"] },
    { title: "Battery & power", icon: BatteryCharging, groups: ["Battery"], criterion: "battery", lead: ["battery"] },
  ],
  laptops: [
    { title: "Display & design", icon: Sun, groups: ["Display", "Design"], criterion: "display", lead: ["displaySize", "panel"] },
    { title: "Battery & power", icon: BatteryCharging, groups: ["Battery"], criterion: "battery", lead: ["batteryLife"] },
    { title: "Ports & connectivity", icon: Plug, groups: ["Ports & Connectivity"], criterion: "ports", lead: ["wifi"] },
  ],
  tvs: [
    { title: "Picture", icon: Sun, groups: ["Picture"], criterion: "picture", lead: ["screenSize", "panel"] },
    { title: "Gaming", icon: Gamepad2, groups: ["Gaming"], criterion: "gaming", lead: ["refreshRate"] },
    { title: "Sound", icon: Volume2, groups: ["Audio"], criterion: "audio", lead: ["audio"] },
    { title: "Design", icon: Ruler, groups: ["Design"], criterion: "build", lead: ["depth"] },
  ],
  headphones: [
    { title: "Sound", icon: AudioLines, groups: ["Sound"], criterion: "sound", lead: ["drivers"] },
    { title: "Noise cancellation", icon: Headphones, groups: ["Noise cancellation"], criterion: "anc", lead: ["ancDepth"], requires: "anc" },
    { title: "Battery & power", icon: BatteryCharging, groups: ["Battery"], criterion: "battery", lead: ["batteryLife"], requires: "batteryLife" },
    { title: "Comfort & design", icon: Ear, groups: ["Comfort"], criterion: "comfort", lead: ["weight"] },
  ],
  tablets: [
    { title: "Display & design", icon: Sun, groups: ["Display", "Design"], criterion: "display", lead: ["displaySize", "panel"] },
    { title: "Stylus & keyboard", icon: PenTool, groups: ["Accessories"], criterion: "productivity", lead: [] },
    { title: "Battery & power", icon: BatteryCharging, groups: ["Battery"], criterion: "battery", lead: ["batteryLife"] },
  ],
  monitors: [
    { title: "Picture", icon: Monitor, groups: ["Picture"], criterion: "picture", lead: ["screenSize", "resolution"] },
    { title: "Motion & gaming", icon: Gamepad2, groups: ["Gaming"], criterion: "motion", lead: ["refreshRate"] },
    { title: "Ports & ergonomics", icon: Plug, groups: ["Connectivity", "Ergonomics"], criterion: "ergonomics", lead: ["usbC"] },
  ],
};

/** Bento of category-specific highlight cards (display & design, battery & power, camera or audio ...). */
export function Highlights({ product, category }: { product: Product; category: CategoryConfig }) {
  const defs = (HIGHLIGHTS[category.slug] ?? []).filter((d) => !d.requires || hasValue(product.specs[d.requires]));
  if (!defs.length) return null;
  const criteria = new Map(category.criteria.map((c) => [c.key, c]));

  return (
    <Stagger className={defs.length === 4 ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 md:grid-cols-3"}>
      {defs.map((d) => {
        const Icon = d.icon;
        const lead = d.lead
          .map((k) => specText(specField(category, k), product.specs[k]))
          .filter((t) => t !== "—" && t !== "None")
          .join(" · ");
        const rows = category.specs.filter(
          (s) => d.groups.includes(s.group) && !d.lead.includes(s.key) && product.specs[s.key] !== undefined,
        );
        const sub = d.criterion ? product.subScores[d.criterion] : undefined;
        return (
          <StaggerItem key={d.title} className="card card-hover relative flex flex-col overflow-hidden p-5 sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full blur-2xl"
              style={{ background: `radial-gradient(circle, color-mix(in oklab, ${product.art.accent} 22%, transparent), transparent 70%)` }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent/15">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              {typeof sub === "number" && (
                <span className="flex items-center gap-2 text-xs text-muted">
                  <span className="hidden sm:inline">{criteria.get(d.criterion!)?.label}</span>
                  <ScoreBadge score={sub} size="sm" />
                </span>
              )}
            </div>
            <h4 className="relative mt-4 text-base font-semibold tracking-tight text-ink">{d.title}</h4>
            {lead && <p className="relative mt-1 text-2xl font-semibold tracking-tight text-ink tnum">{lead}</p>}
            <dl className="relative mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
              {rows.slice(0, 5).map((s) => (
                <div key={s.key} className="flex items-baseline justify-between gap-4">
                  <dt className="shrink-0 text-muted">{s.label}</dt>
                  <dd className="text-right font-medium text-ink-2">
                    {specText(s, product.specs[s.key])}
                  </dd>
                </div>
              ))}
            </dl>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
