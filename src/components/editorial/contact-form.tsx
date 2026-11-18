"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Send } from "lucide-react";
import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "@/app/contact/actions";
import { cn } from "@/lib/format";
import { CONTACT_TOPICS } from "./contact-topics";

const INITIAL: ContactState = { status: "idle", message: "" };

const CONTROL =
  "w-full rounded-xl border bg-surface px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-subtle focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)]";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, INITIAL);
  const reduce = useReducedMotion();
  const err = state.errors ?? {};
  const v = state.values;

  if (state.status === "success") {
    return (
      <motion.div
        role="status"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 rounded-panel border border-line bg-positive-soft p-6"
      >
        <CircleCheck className="mt-0.5 size-6 shrink-0 text-positive" aria-hidden />
        <div>
          <p className="text-lg font-semibold text-ink">Message sent</p>
          <p className="mt-1 text-ink-2">{state.message}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      {/* honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name" error={err.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={v?.name}
            aria-invalid={!!err.name || undefined}
            aria-describedby={err.name ? "name-error" : undefined}
            className={cn(CONTROL, "h-12", err.name ? "border-negative" : "border-line")}
          />
        </Field>
        <Field id="email" label="Email" error={err.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v?.email}
            aria-invalid={!!err.email || undefined}
            aria-describedby={err.email ? "email-error" : undefined}
            className={cn(CONTROL, "h-12", err.email ? "border-negative" : "border-line")}
          />
        </Field>
      </div>

      <Field id="topic" label="Topic" error={err.topic}>
        <select
          id="topic"
          name="topic"
          defaultValue={v?.topic ?? ""}
          aria-invalid={!!err.topic || undefined}
          aria-describedby={err.topic ? "topic-error" : undefined}
          className={cn(CONTROL, "h-12 appearance-none", err.topic ? "border-negative" : "border-line")}
        >
          <option value="" disabled>
            Choose a topic…
          </option>
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field id="message" label="Message" error={err.message}>
        <textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={v?.message}
          aria-invalid={!!err.message || undefined}
          aria-describedby={err.message ? "message-error" : undefined}
          className={cn(CONTROL, "resize-y py-3", err.message ? "border-negative" : "border-line")}
        />
      </Field>

      <AnimatePresence>
        {state.status === "error" && (
          <motion.p
            role="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-negative"
          >
            <CircleAlert className="size-4" aria-hidden /> {state.message}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={pending}
        className="btn-ink inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden />
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
