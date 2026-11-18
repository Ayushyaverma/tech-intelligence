import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/format";

interface ContainerProps {
  className?: string;
  children: ReactNode;
  /** Render as a different element, e.g. "section" or "main". Defaults to "div". */
  as?: ElementType;
}

/** Centred page-width wrapper with responsive side padding. */
export function Container({ className, children, as: Tag = "div" }: ContainerProps) {
  return <Tag className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</Tag>;
}
