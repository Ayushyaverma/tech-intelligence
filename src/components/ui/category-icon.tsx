import { Headphones, Laptop, Monitor, Smartphone, Tablet, Tv, type LucideIcon } from "lucide-react";
import type { CategoryConfig } from "@/lib/types";

const ICONS: Record<CategoryConfig["icon"], LucideIcon> = {
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Tablet,
  Monitor,
};

interface CategoryIconProps {
  icon: CategoryConfig["icon"];
  className?: string;
  strokeWidth?: number;
}

/** Lucide icon for a category config's `icon` name. Decorative by default. */
export function CategoryIcon({ icon, className, strokeWidth = 1.75 }: CategoryIconProps) {
  const Icon = ICONS[icon] ?? Smartphone;
  return <Icon className={className ?? "size-5"} strokeWidth={strokeWidth} aria-hidden />;
}
