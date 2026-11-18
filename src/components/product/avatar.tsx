import type { CSSProperties } from "react";
import { cn } from "@/lib/format";
import { avatarHue, initials } from "./helpers";

/** Letter avatar for retailers and publishers (no third-party logos ship with the site). */
export function InitialAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ "--h": avatarHue(name) } as CSSProperties}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold tracking-tight ring-1 ring-inset",
        "bg-[hsl(var(--h)_70%_50%_/_0.12)] text-[hsl(var(--h)_55%_36%)] ring-[hsl(var(--h)_60%_45%_/_0.18)]",
        "dark:text-[hsl(var(--h)_75%_74%)]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
