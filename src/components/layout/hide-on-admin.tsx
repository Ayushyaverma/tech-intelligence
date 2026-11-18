"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminPath } from "./site";

/** Renders nothing under /admin (the admin area has its own full-screen shell). */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isAdminPath(pathname) ? null : children;
}
