"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { CONTROL } from "./fields";

/** Editable list of short strings (pros, cons, highlights, tags). */
export function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
  multiline,
  addLabel = "Add",
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  addLabel?: string;
}) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink">{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                aria-label={`${label} ${i + 1}`}
                value={item}
                rows={3}
                onChange={(e) => set(i, e.target.value)}
                placeholder={placeholder}
                className={cn(CONTROL, "resize-y py-2")}
              />
            ) : (
              <input
                aria-label={`${label} ${i + 1}`}
                value={item}
                onChange={(e) => set(i, e.target.value)}
                placeholder={placeholder}
                className={cn(CONTROL, "h-10")}
              />
            )}
            <RowButtons
              label={`${label} ${i + 1}`}
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < items.length - 1 ? () => move(i, 1) : undefined}
              onRemove={() => onChange(items.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <AddButton onClick={() => onChange([...items, ""])}>{addLabel}</AddButton>
    </div>
  );
}

export function RowButtons({
  label,
  onUp,
  onDown,
  onRemove,
}: {
  label: string;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
}) {
  const btn = "grid size-10 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30";
  return (
    <div className="flex shrink-0">
      <button type="button" className={btn} onClick={onUp} disabled={!onUp} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <button type="button" className={btn} onClick={onDown} disabled={!onDown} aria-label={`Move ${label} down`}>
        <ArrowDown className="size-4" aria-hidden />
      </button>
      <button type="button" className={cn(btn, "hover:text-negative")} onClick={onRemove} aria-label={`Remove ${label}`}>
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3.5 text-[13px] font-medium text-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
    >
      <Plus className="size-3.5" aria-hidden /> {children}
    </button>
  );
}
