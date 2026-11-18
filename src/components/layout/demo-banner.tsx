import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { getSettings } from "@/lib/data";

/** Slim site-wide notice while the catalogue is sample data (admin → Settings → Demo mode). */
export async function DemoBanner() {
  const { demoMode } = await getSettings();
  if (!demoMode) return null;

  return (
    <aside
      data-site-chrome
      aria-label="Sample data notice"
      className="relative border-b border-line bg-[linear-gradient(90deg,transparent,var(--accent-soft)_30%,var(--accent-soft)_70%,transparent)]"
    >
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs text-ink-2 sm:text-[13px]">
        <FlaskConical className="hidden size-3.5 shrink-0 text-accent sm:block" aria-hidden />
        <span>
          <span className="font-medium text-ink">Sample data</span>
          <span className="text-muted"> — products, prices and scores are illustrative.</span>
        </span>
        <Link
          href="/about"
          className="group inline-flex shrink-0 items-center gap-0.5 rounded font-medium text-accent hover:underline"
        >
          Learn more
          <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </p>
    </aside>
  );
}
