import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DeviceArt, deviceVariant } from "@/components/device-art";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import type { CategoryConfig, Product } from "@/lib/types";
import { HomeSection } from "./home-section";
import { RADIUS, categoryHref } from "./home-utils";

export interface CategoryTileData {
  category: CategoryConfig;
  count: number;
  /** highest-scoring published product, drawn peeking out of the tile */
  top?: { product: Product; score: number };
}

/** Section 5: six frosted tiles, one per category. */
export function CategoryTiles({ tiles }: { tiles: CategoryTileData[] }) {
  return (
    <HomeSection
      id="categories"
      header={{
        eyebrow: "Product categories",
        title: "Explore categories",
        description: "Choose the device you want to research.",
        action: { href: "/category", label: "All categories" },
      }}
      backdrop={<Band />}
    >
      <Stagger as="ul" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" stagger={0.05}>
        {tiles.map((t) => (
          <StaggerItem as="li" key={t.category.slug}>
            <Tile tile={t} />
          </StaggerItem>
        ))}
      </Stagger>
    </HomeSection>
  );
}

function Tile({ tile: { category, count, top } }: { tile: CategoryTileData }) {
  const art = top?.product.art;
  return (
    <Link
      href={categoryHref(category.slug)}
      style={RADIUS.panel}
      className="glass card-hover group relative isolate flex h-full min-h-44 flex-col overflow-hidden rounded-panel p-4 sm:min-h-56 sm:p-6"
    >
      {art && (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-10 -z-10 size-56 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 sm:size-72"
          style={{ background: `color-mix(in oklab, ${art.accent} 26%, transparent)` }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-surface text-ink shadow-xs ring-1 ring-line transition-colors duration-200 group-hover:text-accent sm:size-11">
          <CategoryIcon icon={category.icon} className="size-5" />
        </span>
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full bg-surface/70 text-muted ring-1 ring-line transition-[background-color,color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-ink group-hover:text-bg"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="relative mt-4 max-w-[62%] sm:mt-5 sm:max-w-[58%]">
        <h3 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{category.shortName}</h3>
        <p className="mt-1 hidden text-sm leading-relaxed text-muted sm:line-clamp-2">{category.tagline}</p>
      </div>

      <p className="relative mt-auto pt-4 text-[13px] text-muted">
        <span className="font-semibold text-ink tnum">{count}</span> {count === 1 ? "product" : "products"}
        {top && (
          <span className="hidden lg:inline">
            <span className="mx-1.5 text-subtle" aria-hidden>
              ·
            </span>
            Top: <span className="font-medium text-ink-2">{top.product.name}</span>
          </span>
        )}
      </p>

      {top && (
        <DeviceArt
          category={top.product.category}
          primary={top.product.art.primary}
          accent={top.product.art.accent}
          variant={deviceVariant(top.product)}
          className="pointer-events-none absolute -bottom-5 -right-7 -z-10 w-[64%]! max-w-[17rem] transition-transform duration-500 ease-out group-hover:-translate-x-1 group-hover:-translate-y-2 group-hover:scale-[1.03] sm:-bottom-8 sm:-right-8 sm:w-[52%]!"
        />
      )}
    </Link>
  );
}

/** Soft colour band behind the tiles so the frosted glass has something to blur. */
function Band() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-24 bottom-0 -z-10"
      style={{
        background:
          "radial-gradient(40rem 22rem at 18% 55%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%), radial-gradient(36rem 22rem at 85% 45%, color-mix(in oklab, var(--positive) 7%, transparent), transparent 70%)",
      }}
    />
  );
}
