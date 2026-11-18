"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { cn } from "@/lib/format";
import {
  applyTheme,
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "./theme";

/* A tiny external store over localStorage so every toggle instance
   (header + mobile menu) stays in sync without context. */
const CHANGE_EVENT = "ti-theme-change";
const ORDER: ThemePreference[] = ["light", "dark", "system"];

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : "light";
  } catch {
    return "light";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setPreference(pref: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage unavailable (private mode) — still apply for this page view */
  }
  applyTheme(pref);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const META: Record<ThemePreference, { label: string; Icon: typeof Sun }> = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
  system: { label: "System", Icon: SunMoon },
};

interface ThemeToggleProps {
  className?: string;
  /** show the current mode as text next to the icon (mobile menu) */
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  // Server snapshot is "light" (the default the no-flash script also assumes).
  const pref = useSyncExternalStore(subscribe, readPreference, () => "light" as const);

  // React's dev Strict Mode remount resets <html> attributes; re-apply before paint.
  useLayoutEffect(() => {
    applyTheme(readPreference());
  }, []);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  const { label, Icon } = META[pref];

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`Theme: ${label}. Switch to ${META[next].label.toLowerCase()}`}
      title={`Theme: ${label}`}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full text-ink-2 transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.96]",
        showLabel ? "px-3 text-sm font-medium" : "w-9",
        className,
      )}
    >
      <Icon className="size-[18px]" aria-hidden />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
