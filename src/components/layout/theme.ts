/**
 * Theme preference helpers (no "use client" so the server layout can import
 * THEME_SCRIPT as a plain string). Preference lives in localStorage "ti-theme".
 */

export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "ti-theme";

/**
 * Runs in <head> before first paint: adds class "dark" to <html> when the
 * stored preference (or the OS, for "system") is dark. Default is light.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Browser-only: apply a preference to <html>. */
export function applyTheme(pref: ThemePreference): void {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
