import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { getSettings } from "@/lib/data";
import { cn } from "@/lib/format";

/** Compact newsletter card for editorial pages. Renders nothing when sign-ups are off. */
export async function NewsletterCta({ className }: { className?: string }) {
  const { newsletterEnabled } = await getSettings();
  if (!newsletterEnabled) return null;

  return (
    <section
      aria-labelledby="news-cta-heading"
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-panel border border-line bg-surface p-6 shadow-sm sm:p-8",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]"
      />
      <span className="grid size-11 place-items-center rounded-2xl bg-surface text-accent shadow-sm ring-1 ring-line">
        <Mail className="size-5" aria-hidden />
      </span>
      <h2 id="news-cta-heading" className="mt-5 text-2xl font-semibold tracking-tight text-ink">
        The Sunday brief
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        The launches worth knowing and the price drops we actually recorded — one short email a week.
      </p>
      <div className="mt-auto pt-6">
        <NewsletterForm />
      </div>
    </section>
  );
}
