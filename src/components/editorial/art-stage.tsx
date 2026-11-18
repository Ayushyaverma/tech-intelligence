import { DeviceArt } from "@/components/device-art";
import { cn } from "@/lib/format";
import type { ArtRef } from "./types";

interface ArtStageProps {
  arts: ArtRef[];
  /** Must give the stage a size (e.g. an aspect ratio, or a width inside a stretched row). */
  className?: string;
  /** "single" draws only the first device; "group" adds up to two smaller companions. */
  mode?: "single" | "group";
  /** label the drawing for screen readers (omit when a visible title sits beside it) */
  labelled?: boolean;
}

/** Soft, accent-tinted backdrop used behind article and guide visuals. */
export function stageBackground(accent: string, primary: string): string {
  return [
    `radial-gradient(60% 70% at 50% 45%, color-mix(in oklab, ${accent} 24%, transparent), transparent 72%)`,
    `radial-gradient(90% 70% at 15% 110%, color-mix(in oklab, ${primary} 12%, transparent), transparent 60%)`,
    "linear-gradient(180deg, var(--surface-2), color-mix(in oklab, var(--surface-2) 40%, var(--surface)))",
  ].join(", ");
}

/*
 * Each device sits in an absolutely positioned box; `[&>svg]:h-full` lets the
 * SVG fill that box while its viewBox keeps the 4:3 drawing letterboxed
 * ("meet"), so the art never overflows whatever shape the stage has.
 */
const LAYER = "absolute transition-transform duration-300 ease-out [&>svg]:h-full";

function artProps(a: ArtRef) {
  return { category: a.category, primary: a.primary, accent: a.accent, variant: a.variant };
}

/**
 * Generated device illustration(s) on a tinted stage. Server and client safe.
 * Used for news thumbnails, the lead story and guide cards.
 */
export function ArtStage({ arts, className, mode = "single", labelled = false }: ArtStageProps) {
  const [main, ...rest] = arts;
  const companions = mode === "group" ? rest.slice(0, 2) : [];
  const accent = main?.accent ?? "#4f5bd5";
  const primary = main?.primary ?? "#15171c";

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: stageBackground(accent, primary) }}
      {...(main ? {} : { "aria-hidden": true })}
    >
      {/* faint dot grid for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:16px_16px] opacity-60 [mask-image:radial-gradient(60%_55%_at_50%_45%,#000,transparent)]"
      />
      {companions[0] && (
        <div className={cn(LAYER, "bottom-[10%] left-[3%] h-[52%] w-[40%] group-hover:-translate-x-1")}>
          <DeviceArt {...artProps(companions[0])} />
        </div>
      )}
      {companions[1] && (
        <div className={cn(LAYER, "bottom-[10%] right-[3%] h-[52%] w-[40%] group-hover:translate-x-1")}>
          <DeviceArt {...artProps(companions[1])} />
        </div>
      )}
      {main && (
        <div
          className={cn(
            LAYER,
            companions.length ? "inset-x-[20%] inset-y-[8%] z-10" : "inset-[7%]",
            "group-hover:scale-[1.03]",
          )}
        >
          <DeviceArt {...artProps(main)} title={labelled ? `${main.name} (illustration)` : undefined} />
        </div>
      )}
    </div>
  );
}
