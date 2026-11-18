import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks } from "lucide-react";
import { DeviceArt, deviceVariant } from "@/components/device-art";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { requireCategory } from "@/lib/categories";
import type { BuyingGuide, Product } from "@/lib/types";
import { cn, formatINR } from "@/lib/format";
import { HomeSection } from "./home-section";
import { RADIUS, guideHref, shortDate, tintedBackdrop } from "./home-utils";

export interface GuideCardData {
  guide: BuyingGuide;
  /** published products behind the picks, in pick order */
  picks: Product[];
}

/** Section 7: buying guides by budget and by use. */
export function BuyingGuides({ items }: { items: GuideCardData[] }) {
  return (
    <HomeSection
      id="guides"
      header={{
        eyebrow: "Buying guides",
        title: "Advice by budget and use",
        description: "Short lists built from our scores and recorded prices, with the reasoning for every pick.",
        action: { href: "/guides", label: "All guides" },
      }}
    >
      {items.length ? (
        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <StaggerItem as="li" key={item.guide.id}>
              <GuideCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Guides are on the way"
          description="We're writing budget and use-case guides for every category."
        />
      )}
    </HomeSection>
  );
}

/** Up to three picks fanned out: the top pick in front, the next two behind it. */
const FAN = [
  "z-20 w-[58%]! left-1/2 -translate-x-1/2 bottom-0",
  "z-10 w-[42%]! left-[4%] bottom-3 opacity-90 group-hover:-translate-x-1.5",
  "z-10 w-[42%]! right-[4%] bottom-3 opacity-90 group-hover:translate-x-1.5",
];

function GuideCard({ item: { guide, picks } }: { item: GuideCardData }) {
  const category = requireCategory(guide.category);
  const lead = picks[0];
  return (
    <Link
      href={guideHref(guide.slug)}
      style={RADIUS.card}
      className="card card-hover group flex h-full flex-col overflow-hidden"
    >
      <div
        aria-hidden
        className="relative h-40 overflow-hidden border-b border-line"
        style={lead ? { background: tintedBackdrop(lead.art.accent, lead.art.primary, 24) } : undefined}
      >
        {picks.slice(0, 3).map((p, i) => (
          <DeviceArt
            key={p.slug}
            category={p.category}
            primary={p.art.primary}
            accent={p.art.accent}
            variant={deviceVariant(p)}
            className={cn("absolute transition-transform duration-500 ease-out", FAN[i], i === 0 && "group-hover:-translate-y-1")}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {guide.budgetMax ? (
            <Badge tone="positive">Under {formatINR(guide.budgetMax)}</Badge>
          ) : (
            <Badge tone="accent">By use</Badge>
          )}
          <Badge>{category.shortName}</Badge>
        </div>
        <h3 className="mt-3 text-[17px] font-semibold leading-snug tracking-tight text-ink transition-colors duration-150 group-hover:text-accent">
          {guide.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{guide.excerpt}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-3.5" aria-hidden />
            <span className="tnum">{guide.picks.length} picks</span>
            <span aria-hidden className="text-subtle">
              ·
            </span>
            <span>
              Updated <time dateTime={guide.updatedAt}>{shortDate(guide.updatedAt)}</time>
            </span>
          </span>
          <ArrowRight className="size-4 text-accent transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </div>
      </div>
    </Link>
  );
}
