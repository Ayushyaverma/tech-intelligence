"use client";

import { useActionState, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { subscribeToNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { cn } from "@/lib/format";

const INITIAL: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, INITIAL);
  const reduce = useReducedMotion();
  const inputId = useId();
  const messageId = useId();
  const isError = state.status === "error";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.status === "success" ? (
        <motion.div
          key="done"
          role="status"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-3 rounded-card border border-line bg-positive-soft p-4"
        >
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
          <div>
            <p className="font-medium text-ink">Subscribed</p>
            <p className="mt-0.5 text-sm text-ink-2">{state.message}</p>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={formAction}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
          noValidate
          className="w-full"
        >
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:rounded-full sm:border sm:border-line-strong sm:bg-surface sm:p-1.5 sm:shadow-xs sm:transition-shadow sm:focus-within:border-accent sm:focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
            <input
              id={inputId}
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              aria-invalid={isError || undefined}
              aria-describedby={messageId}
              // focus ring comes from the shadow / wrapper focus-within instead of the outline
              style={{ outline: "none" }}
              className={cn(
                "h-12 w-full min-w-0 rounded-full border border-line-strong bg-surface px-5 text-[15px] text-ink transition-shadow placeholder:text-subtle focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--accent-soft)]",
                "sm:h-11 sm:border-0 sm:bg-transparent sm:pl-4 sm:shadow-none sm:focus-visible:shadow-none",
                isError && "border-negative",
              )}
            />
            {/* Honeypot for bots — hidden from people and assistive tech. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <button
              type="submit"
              disabled={pending}
              className="btn-ink group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium disabled:cursor-wait disabled:opacity-70 sm:h-11"
            >
              {pending ? "Subscribing…" : "Subscribe"}
              {!pending && (
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              )}
            </button>
          </div>
          <p
            id={messageId}
            aria-live="polite"
            className={cn(
              "mt-3 flex min-h-5 items-center gap-1.5 px-1 text-sm",
              isError ? "text-negative" : "text-muted",
            )}
          >
            {isError ? (
              <>
                <CircleAlert className="size-4 shrink-0" aria-hidden />
                {state.message}
              </>
            ) : (
              "One email a week. No spam, unsubscribe anytime."
            )}
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
