import { Suspense, type ReactNode } from "react";
import { HideOnAdmin } from "./hide-on-admin";

/**
 * Public site chrome (banner, header, footer) — hidden on /admin.
 *
 * The pathname check can suspend while prerendering routes with unknown
 * dynamic params (Cache Components), so the chrome itself is the fallback:
 * public pages never lose their header in the static shell.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <HideOnAdmin>{children}</HideOnAdmin>
    </Suspense>
  );
}
