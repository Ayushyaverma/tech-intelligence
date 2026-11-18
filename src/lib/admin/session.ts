/**
 * Admin session token — signed with HMAC-SHA256 through Web Crypto
 * (crypto.subtle), so the same code runs in src/proxy.ts and in server actions.
 *
 * Token format: `<expiresAtMs>.<base64url signature>`. Nothing secret is
 * stored in the cookie; it only proves "someone who knew the password logged
 * in before <expiresAt>".
 *
 * Environment:
 *   ADMIN_PASSWORD  the admin password (required in production)
 *   ADMIN_SECRET    signing key; if unset it is derived from ADMIN_PASSWORD,
 *                   and a fixed development key is used when neither is set
 */

export const ADMIN_COOKIE = "ti_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Default admin password, used in every environment unless ADMIN_PASSWORD is set. */
export const DEFAULT_PASSWORD = "admin";

export type AuthMode =
  /** ADMIN_PASSWORD is configured */
  | "env"
  /** no ADMIN_PASSWORD: the default password "admin" works and a reminder banner shows in the admin */
  | "default";

export function authMode(): AuthMode {
  return process.env.ADMIN_PASSWORD ? "env" : "default";
}

function signingSecret(): string {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  if (process.env.ADMIN_PASSWORD) return `ti-admin-pw:${process.env.ADMIN_PASSWORD}`;
  // Fallback only: set ADMIN_SECRET on the server so session cookies cannot be forged from this public value.
  return "ti-admin-fallback-secret-set-ADMIN_SECRET";
}

const encoder = new TextEncoder();

async function hmacKey(usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", encoder.encode(signingSecret()), { name: "HMAC", hash: "SHA-256" }, false, [
    usage,
  ]);
}

function payload(expiresAt: number) {
  return `ti-admin.v1.${expiresAt}`;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(new ArrayBuffer(bin.length));
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Create a fresh signed token valid for SESSION_MAX_AGE_SECONDS. */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey("sign"), encoder.encode(payload(expiresAt)));
  return `${expiresAt}.${toBase64Url(sig)}`;
}

/** True when the token is well-formed, correctly signed and not expired. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expRaw, sigRaw] = token.split(".");
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || !sigRaw || expiresAt < Date.now()) return false;
  const sig = fromBase64Url(sigRaw);
  if (!sig) return false;
  // subtle.verify compares in constant time.
  return crypto.subtle.verify("HMAC", await hmacKey("verify"), sig, encoder.encode(payload(expiresAt)));
}

/** Only allow redirects back into the admin area (prevents open redirects). */
export function safeAdminPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) return "/admin";
  return next;
}
