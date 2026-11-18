import Link from "next/link";
import { Inbox, type LucideIcon } from "lucide-react";
import { createElement, isValidElement, type ReactNode } from "react";
import { buttonClasses } from "./button";
import { cn } from "@/lib/format";

interface EmptyStateProps {
  /** A lucide icon component (e.g. SearchX) or any element. */
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: ReactNode;
  /** A link button ({ href, label }) or any custom element (e.g. a "Clear filters" button). */
  action?: { href: string; label: string } | ReactNode;
  className?: string;
}

function isLinkAction(a: EmptyStateProps["action"]): a is { href: string; label: string } {
  return typeof a === "object" && a !== null && !isValidElement(a) && "href" in a && "label" in a;
}

function renderIcon(icon: EmptyStateProps["icon"]): ReactNode {
  if (icon === undefined || icon === null) return <Inbox className="size-6" aria-hidden />;
  if (isValidElement(icon) || typeof icon === "string" || typeof icon === "number") return icon;
  // lucide icons are forwardRef objects; plain function components also work
  if (typeof icon === "function" || (typeof icon === "object" && "render" in icon)) {
    return createElement(icon as LucideIcon, { className: "size-6", "aria-hidden": true });
  }
  return icon as ReactNode;
}

/** Friendly placeholder for "no results", empty lists and missing data. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-panel border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, var(--accent-soft), transparent)" }}
      />
      <div className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-surface text-accent shadow-md ring-1 ring-line">
        {renderIcon(icon)}
      </div>
      <h3 className="relative text-lg font-semibold tracking-tight text-ink">{title}</h3>
      {description && <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {action && (
        <div className="relative mt-6">
          {isLinkAction(action) ? (
            <Link href={action.href} className={buttonClasses("glass", "md")}>
              {action.label}
            </Link>
          ) : (
            (action as ReactNode)
          )}
        </div>
      )}
    </div>
  );
}
