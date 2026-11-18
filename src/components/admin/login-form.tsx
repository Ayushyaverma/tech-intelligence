"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Lock } from "lucide-react";
import { login, type LoginState } from "@/lib/admin/auth-actions";
import { CONTROL } from "./fields";
import { cn } from "@/lib/format";

const INITIAL: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);
  const next = useSearchParams().get("next") ?? "/admin";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={!!state.error || undefined}
            aria-describedby={state.error ? "login-error" : undefined}
            className={cn(CONTROL, "h-11 pl-9")}
          />
        </div>
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="flex items-start gap-2 text-sm text-negative">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-ink h-11 w-full rounded-xl text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
