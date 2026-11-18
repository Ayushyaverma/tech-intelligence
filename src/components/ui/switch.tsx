"use client";

import { useId } from "react";
import { cn } from "@/lib/format";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** When set, a hidden input with value "true"/"false" is submitted with the surrounding form. */
  name?: string;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

/** iOS-style toggle (role="switch"). */
export function Switch({ checked, onChange, label, name, hideLabel, disabled, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-accent" : "bg-surface-3 ring-1 ring-inset ring-line-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.06)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
      <label htmlFor={id} className={cn("cursor-pointer select-none text-sm text-ink-2", hideLabel && "sr-only")}>
        {label}
      </label>
      {name && <input type="hidden" name={name} value={checked ? "true" : "false"} />}
    </div>
  );
}
