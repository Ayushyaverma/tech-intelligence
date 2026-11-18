import { ArrowUpRight } from "lucide-react";
import { getSettings } from "@/lib/data";
import type { AdSlotId } from "@/lib/types";
import { cn } from "@/lib/format";

interface AdSlotProps {
  id: AdSlotId;
  className?: string;
}

/**
 * Reserved advertising placement. Renders nothing unless the slot is switched
 * on in Admin → Settings. Ads are always clearly labelled and never affect scores.
 */
export async function AdSlot({ id, className }: AdSlotProps) {
  const settings = await getSettings();
  const slot = settings.adSlots.find((s) => s.id === id);
  if (!slot?.enabled) return null;

  const headline = slot.headline || "Your brand here";
  const body = slot.body || "This placement is reserved for a clearly labelled sponsor message.";
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
          <span className="rounded-full bg-surface-2 px-2 py-0.5 ring-1 ring-inset ring-line">Sponsored</span>
          {slot.sponsor && <span className="truncate normal-case tracking-normal text-muted">{slot.sponsor}</span>}
        </div>
        <p className="text-base font-semibold tracking-tight text-ink">{headline}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      {slot.url && (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 ring-1 ring-line transition-colors duration-150 group-hover:bg-ink group-hover:text-bg">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      )}
    </>
  );

  const shell = cn(
    "group relative flex items-center gap-5 overflow-hidden rounded-card border border-line bg-surface p-5 shadow-xs sm:p-6",
    className,
  );

  return (
    <aside aria-label="Advertisement" data-ad-slot={id}>
      {slot.url ? (
        <a
          href={slot.url}
          target="_blank"
          rel="sponsored noopener"
          className={cn(shell, "transition-[box-shadow,border-color] duration-150 hover:border-line-strong hover:shadow-md")}
        >
          {content}
        </a>
      ) : (
        <div className={shell}>{content}</div>
      )}
    </aside>
  );
}
