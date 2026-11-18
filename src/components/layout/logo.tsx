import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/format";

/**
 * Brand mark: an ink tile with an indigo "insight dial" — a ring with a
 * small gap and a spark breaking out of it. Same artwork as src/app/icon.svg.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  const tile = `${id}-tile`;
  const ring = `${id}-ring`;
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2d3a" />
          <stop offset="1" stopColor="#111319" />
        </linearGradient>
        <linearGradient id={ring} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aab1ff" />
          <stop offset="1" stopColor="#5e6aea" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${tile})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#fff" strokeOpacity="0.12" />
      <path d="M5 1.5h22" stroke="#fff" strokeOpacity="0.18" strokeLinecap="round" />
      <path
        d="M22.5 12.25A7.5 7.5 0 1 1 19.75 9.5"
        fill="none"
        stroke={`url(#${ring})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.6" fill="#fff" />
      <circle cx="23.4" cy="8.6" r="1.7" fill="#c3c8ff" />
    </svg>
  );
}

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Tech Intelligence — home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xl py-1 pr-1 transition-opacity duration-150 hover:opacity-85",
        className,
      )}
    >
      <LogoMark className="transition-transform duration-200 ease-out group-hover:-rotate-6 group-active:scale-95" />
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        Tech <span className="text-muted">Intelligence</span>
      </span>
    </Link>
  );
}
