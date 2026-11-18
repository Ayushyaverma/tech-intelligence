/**
 * Server-side admin guard. Every admin server action calls requireAdmin()
 * first — the proxy redirect is only a convenience, never the security boundary.
 */
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Your admin session has expired. Please sign in again.");
    this.name = "UnauthorizedError";
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Throws UnauthorizedError unless the request carries a valid admin cookie. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new UnauthorizedError();
}
