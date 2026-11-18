"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  DEFAULT_PASSWORD,
  SESSION_MAX_AGE_SECONDS,
  authMode,
  createSessionToken,
  safeAdminPath,
} from "./session";

export interface LoginState {
  error?: string;
}

function sameSecret(a: string, b: string) {
  // Hash first so both buffers have equal length, then compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Sign in with the admin password (used with useActionState on /admin/login). */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const mode = authMode();
  const password = String(formData.get("password") ?? "");
  const expected = mode === "env" ? process.env.ADMIN_PASSWORD! : DEFAULT_PASSWORD;
  if (!password || !sameSecret(password, expected)) {
    // Small fixed delay slows down password guessing.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password isn't right. Please try again." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect(safeAdminPath(String(formData.get("next") ?? "")));
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
