"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpDown, ChevronDown, LayoutGrid, Rows3, Search, X } from "lucide-react";
import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/format";
import { SORT_OPTIONS, type SortKey, type ViewMode } from "./catalog-query";
import { useDraft } from "./use-draft";

/* ---------------------------------------------------------------- search */

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

/** Search within the category. Typing is instant; the URL updates after a short pause. */
export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  const [text, setText, flush] = useDraft(value, onChange, { delay: 220 });
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function clear() {
    setText("");
    flush("");
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn(
        "group relative flex h-11 items-center rounded-full bg-surface shadow-xs ring-1 ring-inset ring-line transition-[box-shadow] duration-150",
        "focus-within:shadow-[0_0_0_4px_var(--accent-soft)] focus-within:ring-accent/60 hover:ring-line-strong",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search className="pointer-events-none absolute left-4 size-4 text-subtle group-focus-within:text-accent" aria-hidden />
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") flush(text);
          if (e.key === "Escape" && text) {
            e.preventDefault();
            clear();
          }
        }}
        className="h-full w-full min-w-0 rounded-full bg-transparent pl-10 pr-10 text-[15px] text-ink placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
        style={{ outline: "none" }}
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 grid size-7 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- sort */

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const id = useId();
  return (
    <div className="relative flex h-9 min-w-0 items-center rounded-full transition-colors duration-150 hover:bg-surface-2/80">
      <ArrowUpDown className="pointer-events-none absolute left-3 size-3.5 text-muted" aria-hidden />
      <label htmlFor={id} className="sr-only">
        Sort products
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-full min-w-0 max-w-full cursor-pointer appearance-none truncate rounded-full bg-transparent pl-8 pr-8 text-[13px] font-medium text-ink"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-muted" aria-hidden />
    </div>
  );
}

/* ---------------------------------------------------------------- view */

const VIEWS: { value: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
  { value: "list", label: "List view", Icon: Rows3 },
];

/** Grid / list switch: a two-option radio group with a sliding indicator. */
export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const layoutId = `view-${useId()}`;
  const reduce = useReducedMotion();

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = value === "grid" ? "list" : "grid";
    onChange(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Layout"
      onKeyDown={onKeyDown}
      className="relative inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface-2 p-0.5 ring-1 ring-inset ring-line"
    >
      {VIEWS.map(({ value: v, label, Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            data-view={v}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              "relative grid size-8 place-items-center rounded-full transition-colors duration-150",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-full bg-surface shadow-sm ring-1 ring-line"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
