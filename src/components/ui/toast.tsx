"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/format";

type ToastTone = "neutral" | "positive" | "warning";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

/* ---------- tiny module-level store (no external deps) ---------- */

const MAX_VISIBLE = 3;
const DURATION_MS = 3800;
const EMPTY: ToastItem[] = [];

let items: ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

/** Show a short message. Call from event handlers in client components. */
export function toast(message: string, opts?: { tone?: ToastTone }) {
  const id = nextId++;
  // Same message twice in a row replaces the old one instead of stacking.
  items = [...items.filter((t) => t.message !== message), { id, message, tone: opts?.tone ?? "neutral" }].slice(
    -MAX_VISIBLE,
  );
  emit();
  setTimeout(() => dismiss(id), DURATION_MS);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ---------- renderer: mount once in the root layout ---------- */

const ICONS = { neutral: Info, positive: CircleCheck, warning: CircleAlert } as const;
const ICON_TONES = { neutral: "text-accent", positive: "text-positive", warning: "text-warning" } as const;

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  const reduce = useReducedMotion();

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.5rem)" }}
    >
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: reduce ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="glass pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-2 pl-3.5 pr-2 text-sm text-ink"
            >
              <Icon className={cn("size-4 shrink-0", ICON_TONES[t.tone])} aria-hidden />
              <span className="min-w-0 flex-1 font-medium leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
