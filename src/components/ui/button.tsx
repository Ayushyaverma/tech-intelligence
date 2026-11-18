import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/format";

export type ButtonVariant = "glass" | "accent" | "ink" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  glass: "btn-glass text-ink",
  accent: "btn-accent",
  ink: "btn-ink",
  ghost:
    "text-ink-2 hover:bg-surface-2 hover:text-ink active:scale-[0.98] transition-[background-color,color,transform] duration-150",
  outline:
    "border border-line-strong bg-surface text-ink shadow-xs hover:bg-surface-2 hover:border-line-strong active:scale-[0.98] transition-[background-color,border-color,transform] duration-150",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
};

/** Shared class string so other elements (e.g. <summary>, <label>) can look like buttons. */
export function buttonClasses(variant: ButtonVariant = "glass", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "glass", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** A next/link styled as a button. */
export function ButtonLink({ variant = "glass", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
