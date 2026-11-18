import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

/**
 * Form controls for the admin. Plain elements with shared styling, so they
 * work in any client form. Pair each control with <Field> for label + hint.
 */

export const CONTROL =
  "w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink shadow-xs placeholder:text-subtle " +
  "transition-[border-color,box-shadow] duration-150 hover:border-[color-mix(in_oklab,var(--line-strong)_100%,var(--ink)_10%)] " +
  "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-negative";

interface FieldProps {
  label: ReactNode;
  /** id of the control, so clicking the label focuses it */
  htmlFor?: string;
  hint?: ReactNode;
  /** right-aligned extra, e.g. a character count or an "Auto" toggle */
  aside?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, aside, required, className, children }: FieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-negative" aria-hidden>
              *
            </span>
          )}
        </label>
        {aside && <div className="shrink-0 text-xs text-muted">{aside}</div>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={cn(CONTROL, "h-10", className)} {...props} />;
}

interface AffixInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/** Input with a muted prefix (₹) or suffix (GB, mAh). */
export function AffixInput({ prefix, suffix, className, ...props }: AffixInputProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      {prefix && <span className="pointer-events-none absolute left-3 text-sm text-muted">{prefix}</span>}
      <input
        className={cn(CONTROL, "h-10 tnum", prefix ? "pl-7" : "", suffix ? "pr-14" : "")}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 max-w-[45%] truncate text-xs font-medium text-muted">{suffix}</span>
      )}
    </div>
  );
}

export function TextArea({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(CONTROL, "min-h-20 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(CONTROL, "h-10 cursor-pointer appearance-none pr-9")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}

/** Small native checkbox styled with the accent colour. */
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 shrink-0 cursor-pointer rounded accent-[var(--accent)]", className)}
      {...props}
    />
  );
}

/** Colour swatch + hex text field. */
export function ColorInput({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex items-center gap-2">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-xl shadow-xs ring-1 ring-line-strong">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={valid ? value : "#888888"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -inset-2 size-14 cursor-pointer border-0 bg-transparent p-0"
        />
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!valid}
        spellCheck={false}
        maxLength={7}
        className={cn(CONTROL, "h-10 font-mono uppercase")}
      />
    </div>
  );
}
